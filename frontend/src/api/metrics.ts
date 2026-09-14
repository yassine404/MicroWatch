import metricsClient from './metricsClient';
import type { MetricPoint } from '../types';

export const getMetricTimeSeries = (
    serviceName: string,
    metric: string,
    from: string,
    to: string
) =>
    metricsClient.get<MetricPoint[]>('/metrics/' + serviceName, {
    params: { metric, from, to },
    });

export const getLatestMetrics = (serviceName: string) =>
    metricsClient.get<Record<string, number>>('/metrics/' + serviceName + '/latest');