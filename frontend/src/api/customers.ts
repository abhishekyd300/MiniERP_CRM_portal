import api from './axios';
import type { ApiResponse, Customer, CustomerNote, Pagination } from './types';

export interface CustomerListResponse {
  customers: Customer[];
  pagination: Pagination;
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface CreateCustomerPayload {
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  type?: string;
  address: string;
  status?: string;
  followUpDate?: string;
}

export async function getCustomersApi(params?: CustomerQueryParams): Promise<CustomerListResponse> {
  const res = await api.get<ApiResponse<CustomerListResponse>>('/customers', { params });
  return res.data.data;
}

export async function getCustomerByIdApi(id: string): Promise<Customer> {
  const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return res.data.data;
}

export async function createCustomerApi(payload: CreateCustomerPayload): Promise<Customer> {
  const res = await api.post<ApiResponse<Customer>>('/customers', payload);
  return res.data.data;
}

export async function updateCustomerApi(id: string, payload: Partial<CreateCustomerPayload>): Promise<Customer> {
  const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, payload);
  return res.data.data;
}

export async function addCustomerNoteApi(id: string, note: string): Promise<CustomerNote> {
  const res = await api.post<ApiResponse<CustomerNote>>(`/customers/${id}/notes`, { note });
  return res.data.data;
}
