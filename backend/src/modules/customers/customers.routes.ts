import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addCustomerNote,
} from './customers.controller';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
  getCustomersQuerySchema,
} from './customers.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// Protect all customer endpoints with authentication
router.use(authenticate);

// GET /api/customers - List with search, filter, pagination (All authenticated roles)
router.get('/', validate(getCustomersQuerySchema), getCustomers);

// GET /api/customers/:id - Customer details with notes (All authenticated roles)
router.get('/:id', getCustomerById);

// POST /api/customers - Create customer (ADMIN, SALES)
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validate(createCustomerSchema),
  createCustomer
);

// PUT /api/customers/:id - Update customer (ADMIN, SALES)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validate(updateCustomerSchema),
  updateCustomer
);

// POST /api/customers/:id/notes - Add follow-up note (ADMIN, SALES)
router.post(
  '/:id/notes',
  authorize(Role.ADMIN, Role.SALES),
  validate(addNoteSchema),
  addCustomerNote
);

export default router;
