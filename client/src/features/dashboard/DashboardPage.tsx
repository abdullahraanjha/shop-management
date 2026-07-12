import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Package, Users, AlertTriangle, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiEnvelope, DashboardData } from '@/types';
import { Card } from '@/components/ui';
import { PageHeader, StatCard, Loading } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<DashboardData>>('/dashboard');
      return res.data.data;
    },
  });

  if (isLoading || !data) return <Loading />;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your shop's performance" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(data.todaySales)} hint={`${data.todayCount} invoices`} icon={<Receipt className="h-5 w-5" />} tone="primary" />
        <StatCard label="Today's Profit" value={formatCurrency(data.todayProfit)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="This Month" value={formatCurrency(data.monthSales)} hint={`Profit ${formatCurrency(data.monthProfit)}`} icon={<DollarSign className="h-5 w-5" />} tone="blue" />
        <StatCard label="Low Stock" value={String(data.lowStockCount)} hint="items need restocking" icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
        <StatCard label="Total Profit" value={formatCurrency(data.totalProfit)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="Products" value={String(data.productCount)} icon={<Package className="h-5 w-5" />} tone="blue" />
        <StatCard label="Customers" value={String(data.customerCount)} icon={<Users className="h-5 w-5" />} tone="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sales trend chart */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 font-semibold">Sales &amp; Profit — Last 7 Days</h3>
          {data.salesTrend.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales in the last 7 days yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Best selling */}
        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Best Selling Products</h3>
          {data.bestSelling.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.bestSelling.map((p, i) => (
                <li key={p.productId} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    {p.name}
                  </span>
                  <span className="font-medium">{p.quantitySold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock table */}
      {data.lowStock.length > 0 && (
        <Card className="mt-6 p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Low Stock Alerts
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2 text-right">Stock</th>
                  <th className="pb-2 text-right">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{p.name}</td>
                    <td className="py-2 text-muted-foreground">{p.sku}</td>
                    <td className="py-2 text-right font-medium text-red-500">{p.stock}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.lowStockAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
