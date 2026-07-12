import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed script — creates an admin user, shop settings, sample categories,
 * products, a supplier, a customer, and one example sale so the dashboard has
 * data on first run. Safe to re-run (idempotent on unique fields).
 */
const prisma = new PrismaClient();

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shop.com' },
    update: {},
    create: { name: 'Shop Admin', email: 'admin@shop.com', password: passwordHash, role: Role.ADMIN },
  });

  // Settings
  if (!(await prisma.setting.findFirst())) {
    await prisma.setting.create({ data: { shopName: 'My Shop', currency: 'USD', taxRate: 0 } });
  }

  // Categories
  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages', description: 'Drinks and refreshments' },
  });
  const snacks = await prisma.category.upsert({
    where: { name: 'Snacks' },
    update: {},
    create: { name: 'Snacks', description: 'Chips, biscuits, and more' },
  });

  // Products
  const productSeed = [
    { name: 'Pepsi 500ml', sku: 'BEV-PEP-500', barcode: '8901234500011', costPrice: 80, sellingPrice: 110, stock: 100, categoryId: beverages.id },
    { name: 'Coca-Cola 500ml', sku: 'BEV-COK-500', barcode: '8901234500028', costPrice: 82, sellingPrice: 110, stock: 80, categoryId: beverages.id },
    { name: 'Mineral Water 1L', sku: 'BEV-WAT-1000', barcode: '8901234500035', costPrice: 20, sellingPrice: 35, stock: 200, categoryId: beverages.id },
    { name: 'Potato Chips 100g', sku: 'SNK-CHP-100', barcode: '8901234500042', costPrice: 45, sellingPrice: 70, stock: 8, lowStockAt: 10, categoryId: snacks.id },
    { name: 'Chocolate Bar', sku: 'SNK-CHO-050', barcode: '8901234500059', costPrice: 30, sellingPrice: 55, stock: 60, categoryId: snacks.id },
  ];
  for (const p of productSeed) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  // Supplier + customer
  const supplier = await prisma.supplier.findFirst({ where: { name: 'City Distributors' } })
    ?? (await prisma.supplier.create({
      data: { name: 'City Distributors', phone: '+1 555 0101', email: 'sales@citydist.com', address: '12 Market St' },
    }));
  const customer = await prisma.customer.findFirst({ where: { name: 'Walk-in Customer' } })
    ?? (await prisma.customer.create({
      data: { name: 'Walk-in Customer', phone: '+1 555 0199' },
    }));

  // Example sale (5 Pepsi) so the dashboard shows real numbers — only if none exist
  if ((await prisma.salesInvoice.count()) === 0) {
    const pepsi = await prisma.product.findUnique({ where: { sku: 'BEV-PEP-500' } });
    if (pepsi) {
      const qty = 5;
      const unitPrice = 110;
      const cost = Number(pepsi.costPrice);
      const lineTotal = qty * unitPrice;
      const lineProfit = (unitPrice - cost) * qty;
      await prisma.$transaction(async (tx) => {
        const inv = await tx.salesInvoice.create({
          data: {
            invoiceNo: 'SAL-' + new Date().getFullYear() + '-000001',
            customerId: customer.id,
            userId: admin.id,
            subTotal: lineTotal,
            total: lineTotal,
            totalProfit: lineProfit,
            paidAmount: lineTotal,
            paymentStatus: 'PAID',
            items: {
              create: [{ productId: pepsi.id, quantity: qty, unitPrice, costPrice: cost, lineTotal, lineProfit }],
            },
          },
        });
        const updated = await tx.product.update({
          where: { id: pepsi.id },
          data: { stock: { decrement: qty } },
        });
        await tx.stockMovement.create({
          data: { productId: pepsi.id, type: 'SALE', quantity: -qty, balance: updated.stock, reference: inv.invoiceNo, userId: admin.id },
        });
      });
    }
  }

  void supplier;
  console.log('🌱 Seed complete.');
  console.log('   Admin login → email: admin@shop.com  password: Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
