// src/taskpane/components/PrivateRoute.tsx

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { checkSubscription, checkRegistration } from './../utils/api';
import { Spin } from 'antd';

interface PrivateRouteProps {
  children: JSX.Element;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      const email = localStorage.getItem('userEmail');
      if (!token || !email) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const registration = await checkRegistration(email);
        setIsRegistered(registration.registered);
        if (!registration.registered) {
          setIsAuthenticated(false);
          return;
        }

        const subscription = await checkSubscription(email);
        setIsSubscribed(subscription.subscribed);
        if (!subscription.subscribed) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error verifying user:', error);
        setIsAuthenticated(false);
      }
    };

    verifyUser();
  }, []);

  if (isAuthenticated === null) {
    // Show a loading spinner while verifying
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin tip="Verifying user..." size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child component
  return children;
};

export default PrivateRoute;
