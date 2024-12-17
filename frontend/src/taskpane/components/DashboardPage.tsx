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
    console.log('useEffect triggered with id:', id, 'dashboards:', dashboards);
    if (id) {
      const dashboard = dashboards.find((d) => d.id === id);
      console.log('Searched for dashboard, found:', dashboard);
      if (dashboard) {
        setCurrentDashboard(dashboard);
      } else {
        console.warn(`No dashboard found with id ${id}`);
        setCurrentDashboard({
          id: '',
          title: '',
          components: [],
          layouts: {},
        });
      }
    } else {
      console.log('No ID provided, setting up a new blank dashboard');
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
