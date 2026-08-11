import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Customer name is required'),
    mobile: z.string().min(1, 'Mobile number is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    businessName: z.string().min(1, 'Business name is required'),
    gstNumber: z.string().optional().or(z.literal('')),
    type: z.nativeEnum(CustomerType).optional().default(CustomerType.RETAIL),
    address: z.string().min(1, 'Address is required'),
    status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.LEAD),
    followUpDate: z.string().optional().or(z.null()),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    mobile: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    businessName: z.string().min(1).optional(),
    gstNumber: z.string().optional().or(z.literal('')),
    type: z.nativeEnum(CustomerType).optional(),
    address: z.string().min(1).optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
    followUpDate: z.string().optional().or(z.null()),
  }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note content is required'),
  }),
});

export const getCustomersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    status: z.nativeEnum(CustomerStatus).optional(),
    type: z.nativeEnum(CustomerType).optional(),
  }),
});
