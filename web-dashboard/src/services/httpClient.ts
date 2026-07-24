import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL || '';
const chatBase = import.meta.env.VITE_CHAT_URL || '';
const apiKey = import.meta.env.VITE_API_KEY || '';
const authToken = import.meta.env.VITE_AUTH_TOKEN || '';

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
  });

  client.interceptors.request.use((config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (import.meta.env.DEV) {
        const msg = error.response
          ? `${error.response.status} ${error.config?.url}`
          : error.message;
        console.warn(`[API] Fallback triggered: ${msg}`);
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createClient(apiBase);
export const chatClient = createClient(chatBase);
