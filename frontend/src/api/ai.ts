// Supprimez IA_BASE_URL

export const fetchAnomaly = async (service: string) => {
    const res = await fetch(`/api/ia/anomaly/sla/${service}`, { method: 'POST' });
    return res.json();
};

export const fetchClusters = async (service: string) => {
    const res = await fetch(`/api/ia/logs/clusters/${service}`);
    return res.json();
};

export const fetchForecast = async (service: string, threshold = 5.0) => {
    const res = await fetch(`/api/ia/forecast/sla/${service}?threshold=${threshold}`);
    return res.json();
};