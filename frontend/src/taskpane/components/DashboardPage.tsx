// src/taskpane/components/DashboardPage.tsx
import React, { useContext, useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { useParams } from 'react-router-dom';
import { DashboardItem } from './types';

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dashboards } = useContext(DashboardContext)!;
  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);

  useEffect(() => {
    if (id) {
      const dashboard = dashboards.find((d) => d.id === id);
      if (dashboard) {
        setCurrentDashboard(dashboard);
      } else {
        // If you have dashboards but didn't find a matching one, you might handle that scenario here
        // For now, let's just consider it as a case of a dashboard not found.
      }
    } else {
      setCurrentDashboard({
        id: '',
        title: '',
        components: [],
        layouts: {},
      });
    }
  }, [id, dashboards]);

  if (!currentDashboard) {
    return <div>Loading...</div>;
  }

  return <Dashboard />;
};

export default DashboardPage;
