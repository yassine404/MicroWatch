import apiClient from './client';

export const getUsers = () =>
    apiClient.get('/admin/users');

export const createUser = (username: string, email: string, password: string, role: string) =>
    apiClient.post('/admin/users', { username, email, password, role });

export const updateUser = (id: string, data: { email?: string; role?: string }) =>
    apiClient.put(`/admin/users/${id}`, data);

export const deleteUser = (id: string) =>
    apiClient.delete(`/admin/users/${id}`);

export const getRoleRequests = () =>
    apiClient.get('/admin/requests');

export const approveRequest = (id: string) =>
    apiClient.put(`/admin/requests/${id}/approve`);

export const rejectRequest = (id: string) =>
    apiClient.put(`/admin/requests/${id}/reject`);

export const approveUser = (id: string) =>
    apiClient.put(`/admin/users/${id}/approve`);