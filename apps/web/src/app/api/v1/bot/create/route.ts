import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_BASE_URL } from "@/const";
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

    try {
        const body = await request.json();
        console.log(body);
        const res = await axios.post(`${AUTH_BASE_URL}/api/v1/bot/create`, body, {headers: { Authorization: `Bearer ${token}` }});
        return new NextResponse(JSON.stringify(res.data))
    }catch (error) {
        console.error("Error creating bot:", error);
        return new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
        });
    }
}