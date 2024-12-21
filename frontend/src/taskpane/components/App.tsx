// src/taskpane/components/App.tsx

import React from 'react';
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomLayout from './CustomLayout';
import DashboardPage from './DashboardPage';
import DashboardList from './DashboardList';
import CreateDashboard from './CreateDashboard';
import Dashboard from './Dashboard';
import '../utils/ChartConfig';
import { DashboardProvider } from '../context/DashboardContext';
import EditTemplate from './EditTemplate';

const App: React.FC = () => {
  return (
    <DashboardProvider>
      <Routes>
        <Route path="/" element={<CustomLayout />}>
          <Route index element={<CreateDashboard />} />
          <Route path="dashboard-editor" element={<DashboardPage />} />
          <Route path="template/:id/edit" element={<EditTemplate />} />
          <Route path="dashboard-list" element={<DashboardList />} />
          <Route path="create" element={<CreateDashboard />} />
          <Route path="dashboard/:id" element={<DashboardPage />}/>
          <Route path="/full-screen" element={<Dashboard isFullScreen />} />
          <Route path="edit-dashboard/:id" element={<DashboardPage />} />
          <Route path="/template/:id/edit" element={<EditTemplate />} />
          <Route path="*" element={<Navigate to="/dashboard-list" replace />} />
        </Route>
      </Routes>
    </DashboardProvider>
  );
};

export default App;
