import React, { createContext, useContext } from "react";

interface AuthContextProps {
  userId: string | null;
  email?: string | null;
}

export const AuthContext = createContext<AuthContextProps>({ userId: null });

export const useAuth = () => useContext(AuthContext);
