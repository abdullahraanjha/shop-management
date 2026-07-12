import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed script — creates an initial admin user and default shop settings so the
 * app is usable immediately after `prisma migrate`. Safe to re-run: it upserts.
 */
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: {
      name: 'Shop Admin',
      email: 'admin@shop.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const existingSettings = await prisma.setting.findFirst();
  if (!existingSettings) {
    await prisma.setting.create({
      data: { shopName: 'My Shop', currency: 'USD', taxRate: 0 },
    });
  }

  await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages', description: 'Drinks and refreshments' },
  });

  console.log('🌱 Seed complete.');
  console.log(`   Admin login → email: ${admin.email}  password: Admin@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
