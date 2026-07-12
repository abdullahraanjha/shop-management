import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { categoryRouter } from './modules/category/category.module.js';
import { productRouter } from './modules/product/product.module.js';
import { supplierRouter } from './modules/supplier/supplier.module.js';
import { customerRouter } from './modules/customer/customer.module.js';
import { purchaseRouter } from './modules/purchase/purchase.module.js';
import { salesRouter } from './modules/sales/sales.module.js';
import { expenseRouter } from './modules/expense/expense.module.js';
import { dashboardRouter } from './modules/dashboard/dashboard.module.js';
import { reportRouter } from './modules/report/report.module.js';
import { settingRouter } from './modules/setting/setting.module.js';

/**
 * Central API router. Every feature module is mounted here under /api.
 */
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/purchases', purchaseRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/expenses', expenseRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/settings', settingRouter);

export default apiRouter;
