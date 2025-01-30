// src/taskpane/components/PrivateRoute.tsx

import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Spin } from "antd";

const PrivateRoute: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    throw new Error("AuthContext must be used within an AuthProvider");
  }
  const { isLoggedIn, isVerified, isLoading } = authContext;
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin tip="Verifying user..." size="large" />
      </div>
    );
  }
  if (!isLoggedIn || !isVerified) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default PrivateRoute;
