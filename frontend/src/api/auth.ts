import api from './axios';
import type { ApiResponse, User } from './types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponseData> {
  const res = await api.post<ApiResponse<LoginResponseData>>('/auth/login', payload);
  return res.data.data;
}

export async function getMeApi(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/auth/me');
  return res.data.data;
}
