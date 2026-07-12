import { Router } from 'express';

/**
 * Central API router. Each feature module registers its own router here as it
 * is built (auth, products, purchases, sales, ...). Keeping one aggregation
 * point makes the mounted surface easy to see at a glance.
 */
export const apiRouter = Router();

// Modules are wired up here in later steps, e.g.:
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/products', productRouter);

export default apiRouter;
