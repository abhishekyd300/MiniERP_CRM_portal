import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  const users = [
    {
      name: 'System Admin',
      email: 'admin@minicrm.com',
      password: 'Admin@123',
      role: Role.ADMIN,
    },
    {
      name: 'Sales Representative',
      email: 'sales@minicrm.com',
      password: 'Sales@123',
      role: Role.SALES,
    },
    {
      name: 'Warehouse Manager',
      email: 'warehouse@minicrm.com',
      password: 'Warehouse@123',
      role: Role.WAREHOUSE,
    },
    {
      name: 'Accounts Officer',
      email: 'accounts@minicrm.com',
      password: 'Accounts@123',
      role: Role.ACCOUNTS,
    },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: hashedPassword,
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
      },
    });

    console.log(`Seeded user: ${user.email} [Role: ${user.role}]`);
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });