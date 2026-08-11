export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type StockMovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  type: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
  notes?: CustomerNote[];
  challans?: Challan[];
  _count?: {
    notes: number;
    challans: number;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  quantityChanged: number;
  type: StockMovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface ChallanItem {
  id?: string;
  challanId?: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  totalAmount?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: User;
  items: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
