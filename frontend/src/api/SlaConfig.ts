import axios from 'axios';

const slaClient = axios.create({
    baseURL: '/api',
});

slaClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export interface SlaConfig {
    id?: string;
    serviceName: string;
    availabilityThreshold: number;
    errorRateThreshold: number;
    responseTimeThresholdMs: number;
}

export const getSlaConfigs = () => slaClient.get<SlaConfig[]>('/sla/config');
export const createSlaConfig = (data: SlaConfig) => slaClient.post('/sla/config', data);
export const updateSlaConfig = (id: string, data: Partial<SlaConfig>) => slaClient.put(`/sla/config/${id}`, data);
export const deleteSlaConfig = (id: string) => slaClient.delete(`/sla/config/${id}`);