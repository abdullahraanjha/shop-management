import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env, isProd } from './config/env.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiRouter } from './routes.js';

/**
 * Builds and configures the Express application.
 * Kept separate from server.ts so it can be imported by tests without
 * actually binding to a port.
 */
export function createApp() {
  const app = express();

  // Security & parsing middleware
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (!isProd) app.use(morgan('dev'));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Shop Management API is running', timestamp: new Date().toISOString() });
  });

  // Feature routes (mounted as each module is built)
  app.use('/api', apiRouter);

  // 404 + centralized error handling (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
