import axios from 'axios';

const slaClient = axios.create({
  
  timeout: 30000,
});

slaClient.interceptors.request.use(
  (config) => {
    // Force l'ajout de /api si l'URL est relative et ne commence pas déjà par /api ou http
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
      config.url = '/api' + config.url;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

slaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // On laisse les composants gérer les erreurs, on ne fait que logger
    console.warn('SLA API error:', error.config?.url, error.message);
    return Promise.reject(error);
  }
);

export default slaClient;