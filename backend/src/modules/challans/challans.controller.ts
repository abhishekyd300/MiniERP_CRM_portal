import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { adjustStock } from '../products/stock.service';
import { ChallanStatus, Prisma, StockMovementType } from '@prisma/client';

async function generateChallanNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const lastChallan = await tx.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
  });

  let nextSeq = 1;
  if (lastChallan) {
    const parts = lastChallan.challanNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
}

export async function createChallan(req: Request, res: Response) {
  const { customerId, items } = req.body;

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  // Fetch product snapshots
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return res.status(404).json({
        success: false,
        error: `Product with ID "${item.productId}" not found`,
      });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const challanNumber = await generateChallanNumber(tx);

    let totalQuantity = 0;
    const challanItemsData = items.map(
      (item: { productId: string; quantity: number }) => {
        const product = productMap.get(item.productId)!;
        totalQuantity += item.quantity;
        return {
          productId: item.productId,
          productNameSnapshot: product.name,
          skuSnapshot: product.sku,
          priceSnapshot: product.unitPrice,
          quantity: item.quantity,
        };
      }
    );

    const newChallan = await tx.challan.create({
      data: {
        challanNumber,
        customerId,
        status: ChallanStatus.DRAFT,
        totalQuantity,
        createdById: req.user!.id,
        items: {
          createMany: {
            data: challanItemsData,
          },
        },
      },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        items: true,
      },
    });

    return newChallan;
  });

  return res.status(201).json({
    success: true,
    data: result,
    message: 'Draft challan created successfully',
  });
}

export async function getChallans(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const status = req.query.status as ChallanStatus | undefined;
  const customerId = req.query.customerId as string | undefined;

  const skip = (page - 1) * limit;

  const whereConditions: Prisma.ChallanWhereInput[] = [];

  if (status) {
    whereConditions.push({ status });
  }

  if (customerId) {
    whereConditions.push({ customerId });
  }

  if (search) {
    whereConditions.push({
      OR: [
        { challanNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { businessName: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.ChallanWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [challans, totalCount] = await Promise.all([
    prisma.challan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, businessName: true, mobile: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        items: true,
      },
    }),
    prisma.challan.count({ where }),
  ]);

  const formattedChallans = challans.map((c) => {
    const totalAmount = c.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );
    return {
      ...c,
      totalAmount,
    };
  });

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    data: {
      challans: formattedChallans,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    },
    message: 'Challans retrieved successfully',
  });
}

export async function getChallanById(req: Request, res: Response) {
  const id = req.params.id as string;

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      items: true,
    },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Challan not found' });
  }

  const totalAmount = challan.items.reduce(
    (sum, item) => sum + item.quantity * item.priceSnapshot,
    0
  );

  return res.status(200).json({
    success: true,
    data: {
      ...challan,
      totalAmount,
    },
    message: 'Challan detail retrieved',
  });
}

export async function updateChallan(req: Request, res: Response) {
  const id = req.params.id as string;
  const { customerId, items } = req.body;

  const existingChallan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existingChallan) {
    return res.status(404).json({ success: false, error: 'Challan not found' });
  }

  if (existingChallan.status !== ChallanStatus.DRAFT) {
    return res.status(400).json({
      success: false,
      error: `Only DRAFT challans can be edited. Current status is ${existingChallan.status}`,
    });
  }

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
  }

  const updatedChallan = await prisma.$transaction(async (tx) => {
    let totalQuantity = existingChallan.totalQuantity;

    if (items && Array.isArray(items)) {
      // Delete existing line items
      await tx.challanItem.deleteMany({ where: { challanId: id } });

      const productIds = items.map((i: { productId: string }) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      totalQuantity = 0;
      const challanItemsData = items.map(
        (item: { productId: string; quantity: number }) => {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new Error(`Product with ID "${item.productId}" not found`);
          }
          totalQuantity += item.quantity;
          return {
            challanId: id,
            productId: item.productId,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            priceSnapshot: product.unitPrice,
            quantity: item.quantity,
          };
        }
      );

      await tx.challanItem.createMany({
        data: challanItemsData,
      });
    }

    const updated = await tx.challan.update({
      where: { id },
      data: {
        customerId: customerId || existingChallan.customerId,
        totalQuantity,
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    return updated;
  });

  return res.status(200).json({
    success: true,
    data: updatedChallan,
    message: 'Draft challan updated successfully',
  });
}

export async function confirmChallan(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Challan not found' });
  }

  if (challan.status !== ChallanStatus.DRAFT) {
    return res.status(400).json({
      success: false,
      error: `Challan cannot be confirmed because it is in "${challan.status}" status. Only DRAFT challans can be confirmed.`,
    });
  }

  try {
    const confirmedChallan = await prisma.$transaction(async (tx) => {
      // 1. Aggregate required quantities by productId to properly validate duplicate line items
      const requiredQuantities = new Map<
        string,
        { totalQty: number; productName: string; sku: string }
      >();

      for (const item of challan.items) {
        const existing = requiredQuantities.get(item.productId) || {
          totalQty: 0,
          productName: item.productNameSnapshot,
          sku: item.skuSnapshot,
        };
        existing.totalQty += item.quantity;
        requiredQuantities.set(item.productId, existing);
      }

      // 2. Re-verify stock levels for aggregated items
      for (const [productId, reqItem] of requiredQuantities.entries()) {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(
            `Product "${reqItem.productName}" (SKU: ${reqItem.sku}) no longer exists in catalog.`
          );
        }

        if (product.currentStock < reqItem.totalQty) {
          throw new Error(
            `Cannot confirm challan: Insufficient stock for "${product.name}" (SKU: ${product.sku}). Available stock: ${product.currentStock}, Required quantity: ${reqItem.totalQty}`
          );
        }
      }

      // 3. Perform stock deductions via adjustStock helper
      for (const item of challan.items) {
        await adjustStock({
          productId: item.productId,
          quantityChanged: item.quantity,
          type: StockMovementType.OUT,
          reason: `Challan Confirmed (${challan.challanNumber})`,
          createdById: req.user!.id,
          tx,
        });
      }

      // 4. Update Challan status to CONFIRMED
      const updated = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CONFIRMED },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      data: confirmedChallan,
      message: `Challan ${challan.challanNumber} confirmed successfully. Stock has been deducted.`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to confirm challan',
    });
  }
}

export async function cancelChallan(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthenticated' });
  }

  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!challan) {
    return res.status(404).json({ success: false, error: 'Challan not found' });
  }

  if (challan.status === ChallanStatus.CANCELLED) {
    return res.status(400).json({
      success: false,
      error: 'Challan is already cancelled.',
    });
  }

  try {
    const cancelledChallan = await prisma.$transaction(async (tx) => {
      // If cancelling a CONFIRMED challan, restore the deducted stock
      if (challan.status === ChallanStatus.CONFIRMED) {
        for (const item of challan.items) {
          await adjustStock({
            productId: item.productId,
            quantityChanged: item.quantity,
            type: StockMovementType.IN,
            reason: `Challan Cancelled (${challan.challanNumber})`,
            createdById: req.user!.id,
            tx,
          });
        }
      }

      const updated = await tx.challan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
          items: true,
        },
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      data: cancelledChallan,
      message: `Challan ${challan.challanNumber} cancelled successfully.${
        challan.status === ChallanStatus.CONFIRMED ? ' Deducted stock has been restored.' : ''
      }`,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to cancel challan',
    });
  }
}
