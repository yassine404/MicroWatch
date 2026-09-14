
import metricsClient from './metricsClient';
import type { MonitoredService } from '../types';

// CRUD des microservices
export const getMicroservices = () =>
    metricsClient.get<MonitoredService[]>('/microservices');

export const createMicroservice = (name: string, metricsUrl: string) =>
    metricsClient.post<MonitoredService>('/microservices', { name, metricsUrl });

export const updateMicroservice = (id: string, data: { name?: string; metricsUrl?: string }) =>
    metricsClient.put<MonitoredService>(`/microservices/${id}`, data);

export const deleteMicroservice = (id: string) =>
    metricsClient.delete(`/microservices/${id}`);