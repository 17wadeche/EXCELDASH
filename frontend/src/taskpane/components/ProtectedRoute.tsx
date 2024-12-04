// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
