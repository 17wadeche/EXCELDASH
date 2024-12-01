// src/services/dashboardService.ts

import axios from 'axios';

const API_BASE_URL = 'https://localhost:5000/api';

export const loadDashboard = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/load-dashboards`);
    return response.data;
  } catch (error: any) {
    console.error('Error loading dashboards:', error);
    throw error;
  }
};

export const saveDashboard = async (dashboardData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/save-dashboard`, {
      dashboardData,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error saving dashboard:', error);
    throw error;
  }
};
