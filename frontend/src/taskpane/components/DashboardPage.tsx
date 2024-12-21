// src/taskpane/components/DashboardPage.tsx
import React, { useContext, useEffect, useState } from 'react';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { useParams } from 'react-router-dom';
import { DashboardItem } from './types';
import { v4 as uuidv4 } from 'uuid';

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    dashboards,
    currentWorkbookId,
    setWidgets,     // Make sure you destructure these from your Context
    setLayouts,
  } = useContext(DashboardContext)!;

  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (id) {
        // We have an ID => attempt to load an existing dashboard
        const found = dashboards.find((d) => d.id === id);
        if (found) {
          // Dashboard found, set it as current AND refresh our local widgets/layouts
          setCurrentDashboard(found);
          setWidgets(found.components || []);  // Overwrite front-end state
          setLayouts(found.layouts || {});
        } else {
          // No dashboard found => set state to null and clear
          console.warn(`No dashboard found with id ${id}`);
          setCurrentDashboard(null);
          setWidgets([]);
          setLayouts({});
        }
      } else {
        // No ID => we’re creating a brand-new blank dashboard in the UI
        console.log('No ID provided, setting up a new blank dashboard');
        setWidgets([]);
        setLayouts({});

        const newDashboard: DashboardItem = {
          id: uuidv4(),
          title: 'Untitled Dashboard',
          components: [],
          layouts: {},
          versions: [],
          workbookId: currentWorkbookId,
        };
        setCurrentDashboard(newDashboard);
      }
      setLoading(false);
    };

    initializeDashboard();
  }, [id, dashboards, currentWorkbookId, setWidgets, setLayouts]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (id && !currentDashboard) {
    return <div>No dashboard found.</div>;
  }

  return <Dashboard />;
};

export default DashboardPage;
