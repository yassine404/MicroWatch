export interface User {
    id: string;
    username: string;
    email: string;
    role: 'VIEWER' | 'ADMIN' | 'ADMIN_SUP';
    status: 'PENDING' | 'ACTIVE';
}

export interface RoleRequest {
    id: string;
    username: string;
    requestedRole: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: string;
    reviewedBy?: string;
    reviewedAt?: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

export interface MonitoredService {
    id: string;
    name: string;
    metricsUrl: string;
    status: string;
    lastChecked: string | null;
    createdAt: string;
}

export interface MetricPoint {
    metric_name: string;
    value: number;
    '@timestamp': string;
    service_name: string;
}

export interface AppLayoutProps {
    children: React.ReactNode;
}