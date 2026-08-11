import api from './axios';
import type { ApiResponse, Challan, Pagination } from './types';

export interface ChallanListResponse {
  challans: Challan[];
  pagination: Pagination;
}

export interface ChallanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: string;
}

export interface CreateChallanItemInput {
  productId: string;
  quantity: number;
}

export interface CreateChallanPayload {
  customerId: string;
  items: CreateChallanItemInput[];
}

export async function getChallansApi(params?: ChallanQueryParams): Promise<ChallanListResponse> {
  const res = await api.get<ApiResponse<ChallanListResponse>>('/challans', { params });
  return res.data.data;
}

export async function getChallanByIdApi(id: string): Promise<Challan> {
  const res = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
  return res.data.data;
}

export async function createChallanApi(payload: CreateChallanPayload): Promise<Challan> {
  const res = await api.post<ApiResponse<Challan>>('/challans', payload);
  return res.data.data;
}

export async function updateChallanApi(id: string, payload: Partial<CreateChallanPayload>): Promise<Challan> {
  const res = await api.put<ApiResponse<Challan>>(`/challans/${id}`, payload);
  return res.data.data;
}

export async function confirmChallanApi(id: string): Promise<Challan> {
  const res = await api.post<ApiResponse<Challan>>(`/challans/${id}/confirm`);
  return res.data.data;
}

export async function cancelChallanApi(id: string): Promise<Challan> {
  const res = await api.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
  return res.data.data;
}
