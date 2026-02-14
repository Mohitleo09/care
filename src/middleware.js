import { NextResponse } from "next/server";
import withAuth from "next-auth/middleware";

const authMiddleware = withAuth({
    pages: {
        signIn: "/login",
    },
});

export default async function proxy(req, event) {
    return authMiddleware(req, event);
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/inbox/:path*",
        "/patients/:path*",
    ],
};
