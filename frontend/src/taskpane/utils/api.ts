// api.ts
import axios from 'axios'; 
import { DashboardItem, NewDashboard, TemplateItem, User } from '../components/types';

const API_BASE_URL = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api';

function decodeToken(token: string) {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    axios.defaults.headers.common['X-Custom-Auth'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['X-Custom-Auth'];
  }
}

const existingToken = localStorage.getItem('token');
if (existingToken) {
  console.log('[api.ts] Found existingToken in localStorage:', existingToken);
  setAuthToken(existingToken);
  const decoded = decodeToken(existingToken);
  if (decoded?.sessionId) {
    console.log('[api.ts] Extracted sessionId from token:', decoded.sessionId);
    localStorage.setItem('sessionId', decoded.sessionId);
  }
} else {
  console.warn('[api.ts] No token found in localStorage on load.');
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
    const response = await axios.get(`${API_BASE_URL}/check-subscription`, { params: { email } });
    return response.data;
  } catch (error: any) {
    console.error('Error in checkSubscription:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
  const token = response.data.token;
  const refreshToken = response.data.refreshToken;
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('userEmail', email);
  setAuthToken(token);
  const decoded = decodeToken(token);
  if (decoded?.sessionId) {
    localStorage.setItem('sessionId', decoded.sessionId);
  }

  return token;
};

export const registerUser = async (email: string, password: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/register`, { email, password });
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
  if (!token) throw new Error('No token found. Please log in again.');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/unsubscribe`,
      { email },
      { headers: { 'X-Custom-Auth': `Bearer ${token}` } }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error in unsubscribeUser:', error);
    throw new Error(error.response?.data?.error || 'An unknown error occurred.');
  }
};

export const getDashboards = async (): Promise<DashboardItem[]> => {
  const token = localStorage.getItem('token');
  console.log('[api.ts] getDashboards => token from localStorage?', token ? 'Yes' : 'No');
  if (!token) {
    console.warn('[api.ts] No token found in localStorage; skipping getDashboards.');
    return [];
  }
  try {
    console.log('[api.ts] Sending GET /dashboards...');
    const response = await axios.get(`${API_BASE_URL}/dashboards`, {
      headers: {
        'X-Custom-Auth': `Bearer ${token}`,
      },
    });
    console.log('[api.ts] GET /dashboards response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[api.ts] getDashboards => Error:', error);
    throw error;
  }
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

export const shareDashboard = async (dashboardId: string, otherEmail: string): Promise<void> => {
  await axios.put(`${API_BASE_URL}/dashboards/${dashboardId}/share`, {
    action: 'add',
    email: otherEmail,
  });
  console.log(`Dashboard ${dashboardId} has been shared with ${otherEmail}.`);
};

export async function searchUsers(query: string): Promise<User[]> {
  const res = await axios.get(`/api/users`, { params: { search: query } });
  return res.data; // array of matched users
}