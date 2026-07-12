import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

/**
 * Application entry point. Verifies the database connection before accepting
 * traffic, then starts the HTTP server. Handles graceful shutdown so Prisma
 * disconnects cleanly on SIGINT/SIGTERM.
 */
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running at http://localhost:${env.PORT} (${env.NODE_ENV})`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
