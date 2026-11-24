import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "NexusBank Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Invalid email or password.");
        }

        if (user.status === "BLOCKED") {
          throw new Error("Your account has been blocked due to security review. Contact support.");
        }

        if (user.status === "DEACTIVATED") {
          throw new Error("Your account is deactivated. Contact bank staff to reactivate.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          twoFactorEnabled: user.twoFactorEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.twoFactorEnabled = user.twoFactorEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "STAFF" | "CUSTOMER";
        session.user.status = token.status as "ACTIVE" | "DEACTIVATED" | "BLOCKED";
        session.user.twoFactorEnabled = Boolean(token.twoFactorEnabled);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
