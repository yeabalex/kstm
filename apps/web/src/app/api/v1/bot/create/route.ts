import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_BASE_URL } from "@/const";
import { decode } from "@/lib/utils";
import { JwtPayload } from "jsonwebtoken";
import axios from "axios";

export async function POST(request: NextRequest) {
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

  const decoded = decode(token) as JwtPayload | null;
  if (!decoded || !decoded.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = { ...body, user_id: decoded.sub };
    const res = await axios.post(`${AUTH_BASE_URL}/api/v1/bot/create`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(res.data, { status: res.status || 201 });
  } catch (error: any) {
    console.error("Error creating bot:", error?.response?.data || error);
    const status = error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to create assistant";
    return NextResponse.json({ error: message }, { status });
  }
}