// src/utils/api.ts
import axios from 'axios';

const API_BASE_URL = 'https://exceladdinbackend-d6a4haekdehchncx.canadacentral-01.azurewebsites.net/api';

export const createCheckoutSession = async (licenseKey: string, plan: 'monthly' | 'yearly') => {
  const response = await axios.post(`${API_BASE_URL}/create-checkout-session`, {
    licenseKey,
    plan,
  });
  return response.data.url;
};

export const checkSubscription = async (licenseKey: string) => {
  const response = await axios.get(`${API_BASE_URL}/check-subscription`, {
    params: { licenseKey },
  });
  return response.data;
};
