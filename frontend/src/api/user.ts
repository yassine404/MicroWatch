import apiClient from './client';

export const getCurrentUser = () =>
  apiClient.get('/users/me');

export const changePassword = (oldPassword: string, newPassword: string) =>
  apiClient.put('/users/me/password', { oldPassword, newPassword });