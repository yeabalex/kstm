import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { CHAT_DOMAIN } from "@/const";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SECRET_KEY = process.env.JWT_SECRET!; // Store this in .env.local

export function validateToken(token: string) {
  try {
    jwt.verify(token, SECRET_KEY);
    return { valid: true };
  } catch (error) {
    return { valid: false };
  }
}

export function decode(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (error) {
    console.error("JWT validation failed:", (error as Error).message);
    return null;
  }
}



export function newPrivateChat(userId: string, botId: string) {
  const sessId = nanoid();
  const url = `${CHAT_DOMAIN}/${userId}/${botId}?sess_id=${sessId}`;
  return {
    url,
    sessId
  }
}