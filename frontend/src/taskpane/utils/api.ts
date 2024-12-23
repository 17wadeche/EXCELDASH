// api.ts
import axios from 'axios'; 
import { DashboardItem, NewDashboard, TemplateItem } from '../components/types';

const API_BASE_URL = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api';

/**
 * Helper to set or remove the default Authorization header for Axios.
 * Call this whenever the token changes (login, logout, refresh).
 */
export function setAuthToken(token: string | null) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// If a token is in localStorage on page load, set it.
// (Remove this if you suspect the token is stale or invalid!)
const existingToken = localStorage.getItem('token');
if (existingToken) {
  setAuthToken(existingToken);
} else {
  console.warn('No token found in localStorage on load.');
}

/**
 * Example: createCheckoutSession
 */
export const createCheckoutSession = async (plan: 'monthly' | 'yearly', email: string) => {
  const response = await axios.post(`${API_BASE_URL}/create-checkout-session`, {
    plan,
    email,
  });
  return response.data.url;
};

/**
 * checkSubscription
 */
export const checkSubscription = async (email: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-subscription`, { params: { email } });
    return response.data;
  } catch (error: any) {
    console.error('Error in checkSubscription:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};

/**
 * loginUser
 * - Logs in, receives token from server, saves token to localStorage, and sets default auth header.
 */
export const loginUser = async (email: string, password: string): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
  const token = response.data.token;

  // Store in localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('userEmail', email);

  // Update Axios default header
  setAuthToken(token);

  return token;
};

/**
 * registerUser
 */
export const registerUser = async (email: string, password: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/register`, { email, password });
};

/**
 * verifySubscription
 */
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

/**
 * checkRegistration
 */
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

/**
 * unsubscribeUser
 */
export const unsubscribeUser = async (email: string) => {
  // Pull the current token from localStorage (or your state management)
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found. Please log in again.');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/unsubscribe`,
      { email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error in unsubscribeUser:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};

/**
 * getDashboards
 */
export const getDashboards = async (): Promise<DashboardItem[]> => {
  // Optionally re-check localStorage token right before the call:
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found in localStorage');
  }

  // Make the request
  const response = await axios.get(`${API_BASE_URL}/dashboards`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const getDashboardById = async (id: string): Promise<DashboardItem> => {
  const response = await axios.get(`${API_BASE_URL}/dashboards/${id}`);
  return response.data;
};

export const createDashboard = async (dashboard: Omit<NewDashboard, 'userEmail'>): Promise<DashboardItem> => {
  const response = await axios.post(`${API_BASE_URL}/dashboards`, dashboard);
  return response.data as DashboardItem;
};

export const updateDashboard = async (id: string, dashboard: DashboardItem): Promise<DashboardItem> => {
  const response = await axios.put(`${API_BASE_URL}/dashboards/${id}`, dashboard);
  return response.data;
};

export const getTemplates = async (): Promise<TemplateItem[]> => {
  const response = await axios.get(`${API_BASE_URL}/templates`);
  return response.data;
};

export const getTemplateById = async (id: string): Promise<TemplateItem> => {
  const response = await axios.get(`${API_BASE_URL}/templates/${id}`);
  return response.data;
};

export const createTemplate = async (template: Omit<TemplateItem, 'userEmail'>): Promise<TemplateItem> => {
  const response = await axios.post(`${API_BASE_URL}/templates`, template);
  return response.data as TemplateItem;
};

export const updateTemplate = async (id: string, template: TemplateItem): Promise<TemplateItem> => {
  const response = await axios.put(`${API_BASE_URL}/templates/${id}`, template);
  return response.data;
};

export const deleteTemplateById = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/templates/${id}`);
};

export const deleteDashboardById = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/dashboards/${id}`);
};