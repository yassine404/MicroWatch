import metricsClient from './metricsClient';   // baseURL = http://localhost:8088/api

export const searchLogs = (params: {
    service?: string;
    level?: string;
    keyword?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}) => metricsClient.get('/logs', { params });