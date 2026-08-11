import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    items: z
      .array(challanItemInputSchema)
      .min(1, 'At least one line item is required for a challan'),
  }),
});

export const updateChallanSchema = z.object({
  body: z.object({
    customerId: z.string().min(1).optional(),
    items: z.array(challanItemInputSchema).min(1).optional(),
  }),
});

export const getChallansQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.nativeEnum(ChallanStatus).optional(),
    customerId: z.string().optional(),
  }),
});
