// Shared API response + domain types used across the frontend.

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  costPrice: string;
  sellingPrice: string;
  stock: number;
  lowStockAt: number;
  unit: string;
  isActive: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  _count?: { purchaseInvoices?: number; salesInvoices?: number };
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: string;
  note?: string | null;
  spentAt: string;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitCost?: string;
  unitPrice?: string;
  costPrice?: string;
  lineTotal: string;
  lineProfit?: string;
  product?: { name: string; sku?: string };
}

export interface SalesInvoice {
  id: string;
  invoiceNo: string;
  customerId?: string | null;
  customer?: { name: string } | null;
  subTotal: string;
  discount: string;
  tax: string;
  total: string;
  totalProfit: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  note?: string | null;
  createdAt: string;
  items?: InvoiceItem[];
  _count?: { items: number };
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  supplierId?: string | null;
  supplier?: { name: string } | null;
  subTotal: string;
  discount: string;
  tax: string;
  total: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  note?: string | null;
  createdAt: string;
  items?: InvoiceItem[];
  _count?: { items: number };
}

export interface Settings {
  id: string;
  shopName: string;
  currency: string;
  taxRate: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
}

export interface DashboardData {
  todaySales: number;
  todayProfit: number;
  todayCount: number;
  monthSales: number;
  monthProfit: number;
  monthCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalSalesCount: number;
  monthExpenses: number;
  productCount: number;
  customerCount: number;
  lowStock: Array<{ id: string; name: string; sku: string; stock: number; lowStockAt: number }>;
  lowStockCount: number;
  bestSelling: Array<{ productId: string; name: string; quantitySold: number; revenue: number }>;
  salesTrend: Array<{ day: string; total: number; profit: number }>;
}
