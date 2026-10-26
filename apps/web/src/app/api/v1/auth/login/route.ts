import { NextRequest, NextResponse } from "next/server";
import { AUTH_BASE_URL } from "@/const";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const response = await fetch(`${AUTH_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ message: errorData.message || "Invalid credentials" }, { status: 401 });
    }

    const data = await response.json();
    const { access_token } = data;

    const res = NextResponse.json({ message: "Login successful" });

    res.cookies.set("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
