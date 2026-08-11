import { Request, Response } from 'express';
import { prisma } from '../../config/db';
import { CustomerType, CustomerStatus, Prisma } from '@prisma/client';

export async function createCustomer(req: Request, res: Response) {
  const {
    name,
    mobile,
    email,
    businessName,
    gstNumber,
    type,
    address,
    status,
    followUpDate,
  } = req.body;

  const customer = await prisma.customer.create({
    data: {
      name,
      mobile,
      email: email || null,
      businessName,
      gstNumber: gstNumber || null,
      type: type || CustomerType.RETAIL,
      address,
      status: status || CustomerStatus.LEAD,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  return res.status(201).json({
    success: true,
    data: customer,
    message: 'Customer created successfully',
  });
}

export async function getCustomers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const status = req.query.status as CustomerStatus | undefined;
  const type = req.query.type as CustomerType | undefined;

  const skip = (page - 1) * limit;

  const whereConditions: Prisma.CustomerWhereInput[] = [];

  if (status) {
    whereConditions.push({ status });
  }

  if (type) {
    whereConditions.push({ type });
  }

  if (search) {
    whereConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const where: Prisma.CustomerWhereInput =
    whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { notes: true, challans: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return res.status(200).json({
    success: true,
    data: {
      customers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
    },
    message: 'Customers retrieved successfully',
  });
}

export async function getCustomerById(req: Request, res: Response) {
  const id = req.params.id as string;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  return res.status(200).json({
    success: true,
    data: customer,
    message: 'Customer details retrieved',
  });
}

export async function updateCustomer(req: Request, res: Response) {
  const id = req.params.id as string;
  const updateData = { ...req.body };

  if (updateData.followUpDate) {
    updateData.followUpDate = new Date(updateData.followUpDate);
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!existingCustomer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: updateData,
  });

  return res.status(200).json({
    success: true,
    data: updatedCustomer,
    message: 'Customer updated successfully',
  });
}

export async function addCustomerNote(req: Request, res: Response) {
  const customerId = req.params.id as string;
  const { note } = req.body;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated',
    });
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!existingCustomer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  const newNote = await prisma.customerNote.create({
    data: {
      customerId,
      note,
      createdById: req.user.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return res.status(201).json({
    success: true,
    data: newNote,
    message: 'Note added successfully',
  });
}
