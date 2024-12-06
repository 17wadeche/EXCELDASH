import { AxiosError } from "axios";
import axios from 'axios';

const API_BASE_URL = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api';

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
    if (axios.isAxiosError(error) && error.response) {
      console.error('Error in checkSubscription:', error.response.data);
      throw new Error(error.response.data.error || 'An unknown error occurred.');
    } else {
      console.error('Error in checkSubscription:', error);
      throw new Error('Network error. Please try again later.');
    }
  }
};

export const loginUser = async (email: string, password: string): Promise<string> => {
  const response = await axios.post(`${API_BASE_URL}/login`, {
    email,
    password,
  });
  return response.data.token;
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
  } catch (error) {
    console.error('Error in verifySubscription:', error);
    throw error;
  }
};

export const checkRegistration = async (email: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-registration`, {
      params: { email },
    });
    return response.data;
  } catch (error) {
    console.error('Error in checkRegistration:', error);
    throw error;
  }
};

export const unsubscribeUser = async (email: string) => {
  const response = await axios.post(`${API_BASE_URL}/unsubscribe`, { email });
  return response.data;
};