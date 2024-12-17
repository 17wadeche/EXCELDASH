import { AxiosError } from "axios";
import axios from 'axios';
import { DashboardItem, NewDashboard, TemplateItem } from '../components/types';

const API_BASE_URL = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api';

const storedToken = localStorage.getItem('token');
if (storedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
}
export const createCheckoutSession = async (plan: 'monthly' | 'yearly', email: string) => {
  const response = await axios.post(`${API_BASE_URL}/create-checkout-session`, {
    plan,
    email,
  });
  return response.data.url;
};
export const checkSubscription = async (email: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-subscription`, {
      params: { email },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in checkSubscription:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};
export const loginUser = async (email: string, password: string): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    email,
    password,
  });
  const token = response.data.token;
  localStorage.setItem('token', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return token;
};
export const registerUser = async (email: string, password: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/register`, {
    email,
    password,
  });
};
export const verifySubscription = async (sessionId: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/verify-subscription`, {
      params: { session_id: sessionId },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in verifySubscription:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};
export const checkRegistration = async (email: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-registration`, {
      params: { email },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in checkRegistration:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};
export const unsubscribeUser = async (email: string) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.post(`${API_BASE_URL}/unsubscribe`, { email }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in unsubscribeUser:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};
export const getDashboards = async (): Promise<DashboardItem[]> => {
  const response = await axios.get(`${API_BASE_URL}/dashboards`);
  return response.data;
};
export const getDashboardById = async (id: string): Promise<DashboardItem> => {
  const response = await axios.get(`${API_BASE_URL}/dashboards/${id}`);
  return response.data;
};
export const createDashboard = async (dashboard: NewDashboard): Promise<DashboardItem> => {
  const response = await axios.post(`${API_BASE_URL}/dashboards`, dashboard);
  return response.data as DashboardItem;
};
export const updateDashboard = async (id: string, dashboard: DashboardItem): Promise<DashboardItem> => {
  const response = await axios.put(`${API_BASE_URL}/dashboards/${id}`, dashboard);
  return response.data;
};
export const getTemplates = async (): Promise<TemplateItem[]> => {
  const response = await axios.get(`${API_BASE_URL}/template`);
  return response.data;
};
export const getTemplateById = async (id: string): Promise<TemplateItem> => {
  const response = await axios.get(`${API_BASE_URL}/template/${id}`);
  return response.data;
};
export const createTemplate = async (template: TemplateItem): Promise<TemplateItem> => {
  const response = await axios.post(`${API_BASE_URL}/template`, template);
  return response.data;
};
export const updateTemplate = async (id: string, template: TemplateItem): Promise<TemplateItem> => {
  const response = await axios.put(`${API_BASE_URL}/template/${id}`, template);
  return response.data;
};
export const deleteDashboardById = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/dashboards/${id}`);
};