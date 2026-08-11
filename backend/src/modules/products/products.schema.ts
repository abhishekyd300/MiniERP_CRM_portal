import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    category: z.string().min(1, 'Category is required'),
    unitPrice: z.number().positive('Unit price must be positive'),
    currentStock: z.number().int().min(0, 'Initial stock cannot be negative').optional().default(0),
    minStockAlert: z.number().int().min(0, 'Min stock alert must be >= 0').optional().default(5),
    location: z.string().min(1, 'Warehouse location is required'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    unitPrice: z.number().positive().optional(),
    minStockAlert: z.number().int().min(0).optional(),
    location: z.string().min(1).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    quantityChanged: z.number().int().positive('Quantity changed must be a positive integer'),
    type: z.nativeEnum(StockMovementType, {
      required_error: 'Stock movement type (IN or OUT) is required',
    }),
    reason: z.string().min(1, 'Adjustment reason is required'),
  }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    lowStock: z.string().optional(), // "true" or "false"
  }),
});
