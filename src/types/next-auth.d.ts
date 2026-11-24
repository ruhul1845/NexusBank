import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
    status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
    twoFactorEnabled: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: "ADMIN" | "STAFF" | "CUSTOMER";
      status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
      twoFactorEnabled: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "STAFF" | "CUSTOMER";
    status: "ACTIVE" | "DEACTIVATED" | "BLOCKED";
    twoFactorEnabled: boolean;
  }
}
