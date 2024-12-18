// src/taskpane/components/DashboardPage.tsx
import React, { useContext, useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { useParams } from 'react-router-dom';
import { DashboardItem } from './types';
import { v4 as uuidv4 } from 'uuid';

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { dashboards, getWorkbookIdFromProperties } = useContext(DashboardContext)!;
  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (id) {
        const dashboard = dashboards.find((d) => d.id === id);
        if (dashboard) {
          setCurrentDashboard(dashboard);
        } else {
          console.warn(`No dashboard found with id ${id}`);
          setCurrentDashboard(null);
        }
      } else {
        console.log('No ID provided, setting up a new blank dashboard');
        const workbookId = await getWorkbookIdFromProperties();
        const newDashboard: DashboardItem = {
          id: uuidv4(),
          title: 'Untitled Dashboard',
          components: [],
          layouts: {},
          versions: [],
          workbookId,
        };
        setCurrentDashboard(newDashboard);
      }
      setLoading(false);
    };

    initializeDashboard();
  }, [id, dashboards, getWorkbookIdFromProperties]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (id && !currentDashboard) {
    return <div>No dashboard found.</div>;
  }

  return <Dashboard />;
};

export default DashboardPage;