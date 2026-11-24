import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (path.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(getHomeForRole(token.role), req.url));
    }

    if (path.startsWith("/staff") && token.role !== "STAFF" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL(getHomeForRole(token.role), req.url));
    }

    if (path.startsWith("/customer") && token.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL(getHomeForRole(token.role), req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

function getHomeForRole(role: string) {
  if (role === "ADMIN") return "/admin";
  if (role === "STAFF") return "/staff";
  return "/customer";
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/customer/:path*"],
};
