import axios from 'axios';
import { message } from 'antd';

const apiClient = axios.create({
   // relatif pour Nginx (ou utilisez une variable d’environnement)
});

apiClient.interceptors.request.use((config) => {
    // Force l'ajout de /api si l'URL est relative et ne commence pas déjà par /api ou http
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
        config.url = '/api' + config.url;
    }

    const token = localStorage.getItem('token');
    // Exclure les routes d'authentification de l'ajout du token
    const isAuthRoute = config.url?.includes('/auth/login') || config.url?.includes('/auth/signup');
    if (token && !isAuthRoute) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error.response?.data?.message || error.message;
        message.error(msg);
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;