import { PrismaClient } from '@prisma/client';
import { isProd } from '../config/env.js';

/**
 * Single shared PrismaClient instance.
 *
 * In development, module reloads (tsx watch) can create many clients and
 * exhaust the database connection pool. We cache the instance on `globalThis`
 * to guarantee exactly one client across hot reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['query', 'warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
