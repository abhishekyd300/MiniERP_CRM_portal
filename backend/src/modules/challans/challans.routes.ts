import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createChallan,
  getChallans,
  getChallanById,
  updateChallan,
  confirmChallan,
  cancelChallan,
} from './challans.controller';
import {
  createChallanSchema,
  updateChallanSchema,
  getChallansQuerySchema,
} from './challans.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// Protect all sales challan routes with authentication
router.use(authenticate);

// GET /api/challans - List challans (pagination, search, filters) (All authenticated roles)
router.get('/', validate(getChallansQuerySchema), getChallans);

// GET /api/challans/:id - Get challan detail (All authenticated roles)
router.get('/:id', getChallanById);

// POST /api/challans - Create draft challan (ADMIN, SALES)
router.post(
  '/',
  authorize(Role.ADMIN, Role.SALES),
  validate(createChallanSchema),
  createChallan
);

// PUT /api/challans/:id - Edit draft challan (ADMIN, SALES)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.SALES),
  validate(updateChallanSchema),
  updateChallan
);

// POST /api/challans/:id/confirm - Confirm draft & deduct stock in transaction (ADMIN, SALES)
router.post(
  '/:id/confirm',
  authorize(Role.ADMIN, Role.SALES),
  confirmChallan
);

// POST /api/challans/:id/cancel - Cancel draft/confirmed challan & restore stock if confirmed (ADMIN, SALES, WAREHOUSE)
router.post(
  '/:id/cancel',
  authorize(Role.ADMIN, Role.SALES, Role.WAREHOUSE),
  cancelChallan
);

export default router;
