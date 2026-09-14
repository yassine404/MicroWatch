import slaClient from './slaClient';

export interface Alert {
  id: string;
  serviceName: string;
  type: 'THRESHOLD' | 'ANOMALY';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  details: string | null;
}

export const getUnacknowledgedAlerts = () => slaClient.get<Alert[]>('/alerts');

export const getAllAlerts = () => slaClient.get<Alert[]>('/alerts/all'); // Nouveau

export const getAlertsForService = (serviceName: string) =>
  slaClient.get<Alert[]>(`/alerts/service/${serviceName}`);

export const acknowledgeAlert = (id: string) =>
  slaClient.patch<Alert>(`/alerts/${id}/acknowledge`);

export const deleteAlert = (id: string) =>
  slaClient.delete(`/alerts/${id}`);