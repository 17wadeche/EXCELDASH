// src/taskpane/components/AuthRedirect.tsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AuthRedirect: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext is undefined. Make sure you are using AuthProvider.");
  }
  const { isLoggedIn } = authContext;
  return isLoggedIn ? <Navigate to="/create" replace /> : <Navigate to="/login" replace />;
};

export default AuthRedirect;
