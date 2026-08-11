import { Router } from 'express';
import { Role } from '@prisma/client';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustProductStock,
  getProductMovements,
} from './products.controller';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  getProductsQuerySchema,
} from './products.schema';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// Protect all product endpoints with authentication
router.use(authenticate);

// GET /api/products - List products (pagination, search, low-stock filter) (All authenticated roles)
router.get('/', validate(getProductsQuerySchema), getProducts);

// GET /api/products/:id - Product detail (All authenticated roles)
router.get('/:id', getProductById);

// GET /api/products/:id/movements - Stock movement audit log (All authenticated roles)
router.get('/:id/movements', getProductMovements);

// POST /api/products - Create product (ADMIN, WAREHOUSE)
router.post(
  '/',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate(createProductSchema),
  createProduct
);

// PUT /api/products/:id - Update product metadata (ADMIN, WAREHOUSE)
router.put(
  '/:id',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate(updateProductSchema),
  updateProduct
);

// POST /api/products/:id/stock - Manual stock adjustment (ADMIN, WAREHOUSE)
router.post(
  '/:id/stock',
  authorize(Role.ADMIN, Role.WAREHOUSE),
  validate(adjustStockSchema),
  adjustProductStock
);

export default router;
