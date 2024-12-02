import { AxiosError } from "axios";
import axios from 'axios';

const API_BASE_URL = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api';

export const createCheckoutSession = async (licenseKey: string, plan: 'monthly' | 'yearly') => {
  const response = await axios.post(`${API_BASE_URL}/create-checkout-session`, {
    licenseKey,
    plan,
  });
  return response.data.url;
};

export const checkSubscription = async (licenseKey: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/check-subscription`, {
      params: { licenseKey },
    });
    return response.data;
  } catch (error) {
    console.error('Error in checkSubscription:', error);
    throw error;
  }
};