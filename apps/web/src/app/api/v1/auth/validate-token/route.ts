import { cookies } from "next/headers"; // Server-side cookie access
import { AUTH_BASE_URL } from "@/const";
import { NextResponse } from "next/server";
import { validateToken } from "@/lib/utils";

export async function GET() {
  const cookieStore = cookies(); 
  const token = (await cookieStore).get("access_token")?.value;

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login",
      },
    });
  }

  try {
    const data = validateToken(token);
    console.log(data);
    return NextResponse.json(data);
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
