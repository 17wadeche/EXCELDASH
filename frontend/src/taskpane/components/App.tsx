// src/taskpane/components/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomLayout from './CustomLayout';
import DashboardPage from './DashboardPage';
import DashboardList from './DashboardList';
import CreateDashboard from './CreateDashboard';
import Dashboard from './Dashboard';
import RegisterPage from './RegisterPage';
import LoginPage from './LoginPage';
import SubscribePage from './SubscribePage';
import EditTemplate from './EditTemplate';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
import EnterResetCodePage from './EnterResetCodePage';
import { DashboardProvider } from '../context/DashboardContext';
import PrivateRoute from './PrivateRoute'; // We'll create this next

const App: React.FC = () => {
  return (
    <DashboardProvider>
      <Routes>
        <Route path="/" element={<CustomLayout />}>
          <Route
            path="/create"
            element={
              <PrivateRoute>
                <CreateDashboard />
              </PrivateRoute>
            }
          />
          <Route path="dashboard-editor" element={<DashboardPage />} />
          <Route path="template/:id/edit" element={<EditTemplate />} />
          <Route path="dashboard-list" element={<DashboardList />} />
          <Route path="dashboard/:id" element={<DashboardPage />} />
          <Route path="/full-screen" element={<Dashboard isFullScreen />} />
          <Route path="edit-dashboard/:id" element={<DashboardPage />} />
          <Route path="/template/:id/edit" element={<EditTemplate />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="subscribe" element={<SubscribePage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="enter-code" element={<EnterResetCodePage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/dashboard-list" replace />} />
        </Route>
      </Routes>
    </DashboardProvider>
  );
};

export default App;
