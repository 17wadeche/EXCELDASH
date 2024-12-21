// src/taskpane/components/DashboardPage.tsx

import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { DashboardItem } from './types';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { dashboards,  currentWorkbookId,  setWidgets,  setLayouts } = useContext(DashboardContext)!;

  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      if (id) {
        const found = dashboards.find((d) => d.id === id);
        if (found) {
          setCurrentDashboard(found);
          setWidgets(found.components || []);
          setLayouts(found.layouts || {});
        } else {
          console.warn(`No dashboard found with id ${id} in local array`);
          setCurrentDashboard(null);
          setWidgets(createdDashboard.components || []);
          setLayouts(createdDashboard.layouts || {});
          message.warning(`Dashboard with ID ${id} not found, showing blank.`);
        }
      } else {
        console.log('No ID provided, setting up a new blank dashboard');
        setWidgets(createdDashboard.components || []);
        setLayouts(createdDashboard.layouts || {});
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
