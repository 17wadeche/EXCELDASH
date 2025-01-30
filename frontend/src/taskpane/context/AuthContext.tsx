// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { checkRegistration, checkSubscription } from "./../utils/api";

interface AuthState {
  isLoggedIn: boolean;
  isVerified: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setAuthState: (state: Partial<AuthState>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthStateInternal] = useState<AuthState>({
    isLoggedIn: false,
    isVerified: false,
    isLoading: false,
  });

  const setAuthState = (state: Partial<AuthState>) => {
    setAuthStateInternal((prevState) => ({ ...prevState, ...state }));
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const email = localStorage.getItem("userEmail");
      if (token && email) {
        setAuthState({ isLoggedIn: true, isVerified: false, isLoading: true });
        try {
          const registration = await checkRegistration(email);
          if (registration.registered) {
            const subscription = await checkSubscription(email);
            if (subscription.subscribed) {
              setAuthState({ isLoggedIn: true, isVerified: true, isLoading: false });
              return;
            }
          }
          setAuthState({ isLoggedIn: false, isVerified: false, isLoading: false });
        } catch (error) {
          console.error("Error during authentication initialization:", error);
          setAuthState({ isLoggedIn: false, isVerified: false, isLoading: false });
        }
      }
    };

    initializeAuth();
  }, []);

  return <AuthContext.Provider value={{ ...authState, setAuthState }}> {children} </AuthContext.Provider>;
};
