// src/taskpane/components/DashboardPage.tsx

import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from './Dashboard';
import { DashboardContext } from '../context/DashboardContext';
import { DashboardItem } from './types';
import { v4 as uuidv4 } from 'uuid';
import { message } from 'antd';
import axios from 'axios';

const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { dashboards,  currentWorkbookId,  setWidgets,  setLayouts } = useContext(DashboardContext)!;

  const [currentDashboard, setCurrentDashboard] = useState<DashboardItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (id) {
          const found = dashboards.find((d) => d.id === id);
          if (found) {
            console.log(`Dashboard #${id} found locally. Score!`);
            setCurrentDashboard(found);
            setWidgets(found.components || []);
            setLayouts(found.layouts || {});
          } else {
            console.warn(`Dashboard #${id} was not invited to our local party... let's bug the server.`);
            const response = await axios.get(`/api/dashboards/${id}`);
            const remoteDashboard = response.data;
            if (remoteDashboard) {
              console.log(`Found Dashboard #${id} on the server. Ba-da-bing, ba-da-boom!`);
              setCurrentDashboard(remoteDashboard);
              setWidgets(remoteDashboard.components || []);
              setLayouts(remoteDashboard.layouts || {});
            } else {
              console.warn(`Uhh... the server also doesn't know this ID. This might be the Bermuda Triangle of dashboards.`);
              setCurrentDashboard(null);
              setWidgets([]);
              setLayouts({});
              message.warning(`Dashboard with ID ${id} not found on server, showing blank. 🤷‍♀️`);
            }
          }
        } else {
          console.log('No ID? No problem. Let’s create a brand-spankin’ new blank dashboard!');
          const newDashboard: DashboardItem = {
            id: uuidv4(),
            title: 'Untitled Dashboard',
            components: [],
            layouts: {},
            versions: [],
            workbookId: currentWorkbookId,
          };
          setCurrentDashboard(newDashboard);
          setWidgets(newDashboard.components);
          setLayouts(newDashboard.layouts);
        }
      } catch (error) {
        console.error('Oh no, an error occurred while trying to fetch or create a dashboard:', error);
        message.error('Something went wrong! Dashboard might be stuck on the Moon.');
        setCurrentDashboard(null);
        setWidgets([]);
        setLayouts({});
      } finally {
        setLoading(false);
      }
    };
    initializeDashboard();
  }, [id]);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (id && !currentDashboard) {
    return <div>No dashboard found.</div>;
  }
  return <Dashboard />;
};
export default DashboardPage;