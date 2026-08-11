import api from './axios';
import type { ApiResponse, Pagination, Product, StockMovement } from './types';

export interface ProductListResponse {
  products: Product[];
  pagination: Pagination;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: boolean;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock?: number;
  minStockAlert?: number;
  location: string;
}

export interface AdjustStockPayload {
  quantityChanged: number;
  type: 'IN' | 'OUT';
  reason: string;
}

export interface AdjustStockResponseData {
  product: Product;
  movement: StockMovement;
}

export async function getProductsApi(params?: ProductQueryParams): Promise<ProductListResponse> {
  const res = await api.get<ApiResponse<ProductListResponse>>('/products', {
    params: {
      ...params,
      lowStock: params?.lowStock ? 'true' : undefined,
    },
  });
  return res.data.data;
}

export async function getProductByIdApi(id: string): Promise<Product> {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}

export async function createProductApi(payload: CreateProductPayload): Promise<Product> {
  const res = await api.post<ApiResponse<Product>>('/products', payload);
  return res.data.data;
}

export async function updateProductApi(id: string, payload: Partial<CreateProductPayload>): Promise<Product> {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, payload);
  return res.data.data;
}

export async function adjustStockApi(id: string, payload: AdjustStockPayload): Promise<AdjustStockResponseData> {
  const res = await api.post<ApiResponse<AdjustStockResponseData>>(`/products/${id}/stock`, payload);
  return res.data.data;
}

export async function getProductMovementsApi(id: string): Promise<StockMovement[]> {
  const res = await api.get<ApiResponse<StockMovement[]>>(`/products/${id}/movements`);
  return res.data.data;
}
