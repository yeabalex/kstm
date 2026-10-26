"use client";

import ApiClient from "@/lib/ApiClient";
import { NEXT_JS_PROXY_URL } from "@/const";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { AuthContext } from "@/context/AuthContext";

interface User {
  email: string;
  exp: number;
  iat: number;
  sub: string;
}

export default function AuthWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [valid, setValid] = useState(false);
  const apiClient = new ApiClient(NEXT_JS_PROXY_URL);
  const router = useRouter();

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await apiClient.get("/api/v1/auth/validate-token", {
          withCredentials: true,
        });
        
        if (!res.valid) {
          return router.push("/login");
        }
        setValid(res.valid);
      } catch (error) {
        console.error("Token validation error:", error);
        router.push("/login");
      }
    }
  
    async function fetchUser() {
      try {
        const res = await apiClient.get("/api/v1/auth/decode", {
          withCredentials: true,
        });
        setUser(res);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } 
    }
  
    validateToken();
    fetchUser();
  }, [router]);
  

  if (!valid) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  
  return (
    <AuthContext.Provider value={{ userId: user?.sub || null, email: user?.email || null }}>
      {children}
    </AuthContext.Provider>
  );
}
