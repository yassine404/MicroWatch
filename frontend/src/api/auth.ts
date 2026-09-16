import apiClient from "./client";

export const signup = (username: string, email: string,password: string) =>
    apiClient.post('/auth/signup', {username, email, password});

export const login = (username: string, password: string) =>
  apiClient.post('/auth/login', { username, password });

export const requestAdmin = () =>
  apiClient.post('/auth/request-admin');