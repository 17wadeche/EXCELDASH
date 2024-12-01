// src/taskpane/components/DashboardPage.tsx
import React, { useContext, useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { useParams } from 'react-router-dom';
import { DashboardItem } from './types'; // Ensure this import exists

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dashboards } = useContext(DashboardContext)!;
  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);

  useEffect(() => {
    const dashboard = dashboards.find((d) => d.id === id);
    if (dashboard) {
      setCurrentDashboard(dashboard);
    }
  }, [id, dashboards]);

  if (!currentDashboard) {
    return <div>Loading...</div>;
  }

  return <Dashboard />;
};

export default DashboardPage;
