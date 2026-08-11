import { PrismaClient, StockMovementType, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../../config/db';

export interface AdjustStockParams {
  productId: string;
  quantityChanged: number;
  type: StockMovementType;
  reason: string;
  createdById: string;
  tx?: Prisma.TransactionClient;
}

export async function adjustStock(params: AdjustStockParams) {
  const { productId, quantityChanged, type, reason, createdById, tx } = params;

  const db = tx || defaultPrisma;

  if (quantityChanged <= 0) {
    throw new Error('Quantity changed must be a positive integer');
  }

  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  let newStock = product.currentStock;

  if (type === StockMovementType.IN) {
    newStock += quantityChanged;
  } else if (type === StockMovementType.OUT) {
    if (product.currentStock < quantityChanged) {
      throw new Error(
        `Insufficient stock for "${product.name}" (SKU: ${product.sku}). Current stock: ${product.currentStock}, requested reduction: ${quantityChanged}`
      );
    }
    newStock -= quantityChanged;
  }

  const updatedProduct = await db.product.update({
    where: { id: productId },
    data: { currentStock: newStock },
  });

  const stockMovement = await db.stockMovement.create({
    data: {
      productId,
      quantityChanged,
      type,
      reason,
      createdById,
    },
  });

  return {
    product: updatedProduct,
    stockMovement,
  };
}
