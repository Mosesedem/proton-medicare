"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  authMethod: "google" | "credentials" | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void; // Add logout function
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  authMethod: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextType>({
    user: null,
    accessToken: null,
    authMethod: null,
    isLoading: true,
    isAuthenticated: false,
    logout: () => {},
  });

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const data = await response.json();

        if (data.success) {
          setAuthState((prev) => ({
            ...prev,
            user: data.user,
            accessToken: data.accessToken,
            authMethod: data.user.authMethod,
            isLoading: false,
            isAuthenticated: true,
          }));
        } else {
          resetAuthState();
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        resetAuthState();
      }
    }

    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAuthState = () => {
    setAuthState({
      user: null,
      accessToken: null,
      authMethod: null,
      isLoading: false,
      isAuthenticated: false,
      logout,
    });
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      resetAuthState();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <NextAuthSessionProvider>
      <AuthContext.Provider value={{ ...authState, logout }}>
        {children}
      </AuthContext.Provider>
    </NextAuthSessionProvider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
