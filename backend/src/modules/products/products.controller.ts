import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { adjustStock } from './stock.service';
import { StockMovementType, Prisma } from '@prisma/client';

export async function createProduct(req: Request, res: Response) {
  const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  const existingProduct = await prisma.product.findUnique({
    where: { sku },
  });

  if (existingProduct) {
    return res.status(400).json({
      success: false,
      error: `Product with SKU "${sku}" already exists`,
    });
  }

  const initialStock = currentStock || 0;

  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        name,
        sku,
        category,
        unitPrice,
        currentStock: initialStock,
        minStockAlert: minStockAlert ?? 5,
        location,
      },
    });

    if (initialStock > 0) {
      await adjustStock({
        productId: createdProduct.id,
        quantityChanged: initialStock,
        type: StockMovementType.IN,
        reason: 'Initial Stock Setup',
        createdById: req.user!.id,
        tx,
      });
    }

    return createdProduct;
  });

  const productWithFlag = {
    ...product,
    isLowStock: product.currentStock <= product.minStockAlert,
  };

  return res.status(201).json({
    success: true,
    data: productWithFlag,
    message: 'Product created successfully',
  });
}

export async function getProducts(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const lowStockOnly = req.query.lowStock === 'true';

  const skip = (page - 1) * limit;

  const whereConditions: Prisma.ProductWhereInput[] = [];

  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  let where: Prisma.ProductWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  let products = await prisma.product.findMany({
    where,
    skip: lowStockOnly ? undefined : skip,
    take: lowStockOnly ? undefined : limit,
    orderBy: { createdAt: 'desc' },
  });

  let formattedProducts = products.map((p) => ({
    ...p,
    isLowStock: p.currentStock <= p.minStockAlert,
  }));

  if (lowStockOnly) {
    formattedProducts = formattedProducts.filter((p) => p.isLowStock);
  }

  const totalCount = lowStockOnly
    ? formattedProducts.length
    : await prisma.product.count({ where });

  if (lowStockOnly) {
    formattedProducts = formattedProducts.slice(skip, skip + limit);
  }

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    data: {
      products: formattedProducts,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    },
    message: 'Products retrieved successfully',
  });
}

export async function getProductById(req: Request, res: Response) {
  const id = req.params.id as string;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  const productWithFlag = {
    ...product,
    isLowStock: product.currentStock <= product.minStockAlert,
  };

  return res.status(200).json({
    success: true,
    data: productWithFlag,
    message: 'Product detail retrieved',
  });
}

export async function updateProduct(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name, sku, category, unitPrice, minStockAlert, location } = req.body;

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  if (sku && sku !== existingProduct.sku) {
    const skuConflict = await prisma.product.findUnique({ where: { sku } });
    if (skuConflict) {
      return res.status(400).json({
        success: false,
        error: `Product with SKU "${sku}" already exists`,
      });
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      sku,
      category,
      unitPrice,
      minStockAlert,
      location,
    },
  });

  const productWithFlag = {
    ...updatedProduct,
    isLowStock: updatedProduct.currentStock <= updatedProduct.minStockAlert,
  };

  return res.status(200).json({
    success: true,
    data: productWithFlag,
    message: 'Product updated successfully',
  });
}

export async function adjustProductStock(req: Request, res: Response) {
  const productId = req.params.id as string;
  const { quantityChanged, type, reason } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  try {
    const result = await adjustStock({
      productId,
      quantityChanged,
      type,
      reason,
      createdById: req.user.id,
    });

    const productWithFlag = {
      ...result.product,
      isLowStock: result.product.currentStock <= result.product.minStockAlert,
    };

    return res.status(200).json({
      success: true,
      data: {
        product: productWithFlag,
        movement: result.stockMovement,
      },
      message: `Stock successfully updated (${type} ${quantityChanged})`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to adjust stock',
    });
  }
}

export async function getProductMovements(req: Request, res: Response) {
  const productId = req.params.id as string;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
    });
  }

  const movements = await prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return res.status(200).json({
    success: true,
    data: movements,
    message: 'Stock movements retrieved successfully',
  });
}
