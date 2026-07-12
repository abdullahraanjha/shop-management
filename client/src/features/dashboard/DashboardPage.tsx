import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { DollarSign, TrendingUp, Package, Users, AlertTriangle, Receipt, Wallet, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiEnvelope, DashboardData } from '@/types';
import { Card, Badge } from '@/components/ui';
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

  const maxSold = Math.max(...data.bestSelling.map((b) => b.quantitySold), 1);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your shop's performance" />

      {/* Lead metrics — hero card + supporting KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard hero label="Today's Sales" value={formatCurrency(data.todaySales)} hint={`${data.todayCount} invoices · profit ${formatCurrency(data.todayProfit)}`} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="This Month" value={formatCurrency(data.monthSales)} hint={`${data.monthCount} invoices`} icon={<DollarSign className="h-5 w-5" />} tone="blue" />
        <StatCard label="Monthly Profit" value={formatCurrency(data.monthProfit)} hint={`expenses ${formatCurrency(data.monthExpenses)}`} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <StatCard label="Low Stock" value={String(data.lowStockCount)} hint="items need restocking" icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} hint="all time" icon={<DollarSign className="h-5 w-5" />} tone="primary" />
        <StatCard label="Total Profit" value={formatCurrency(data.totalProfit)} hint="all time" icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="Products" value={String(data.productCount)} hint="in catalog" icon={<Package className="h-5 w-5" />} tone="blue" />
        <StatCard label="Customers" value={String(data.customerCount)} hint="registered" icon={<Users className="h-5 w-5" />} tone="primary" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue trend — smooth gradient area chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Revenue &amp; Profit</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
              <ArrowUpRight className="h-3.5 w-3.5" /> live
            </span>
          </div>
          {data.salesTrend.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">No sales in the last 7 days yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.salesTrend} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                    borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
                  }}
                />
                <Area type="monotone" dataKey="total" name="Sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gSales)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} fill="url(#gProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Best sellers with share bars */}
        <Card className="p-6">
          <h3 className="font-semibold">Best Sellers</h3>
          <p className="mb-5 text-xs text-muted-foreground">By quantity sold</p>
          {data.bestSelling.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">No sales data yet.</p>
          ) : (
            <ul className="space-y-4">
              {data.bestSelling.map((p, i) => (
                <li key={p.productId}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.quantitySold} sold</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${Math.max(8, Math.round((p.quantitySold / maxSold) * 100))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock */}
      {data.lowStock.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold leading-tight">Low Stock Alerts</h3>
              <p className="text-xs text-muted-foreground">These products are at or below their restock threshold</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Threshold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.lowStock.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{p.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.sku}</td>
                    <td className="px-6 py-3 text-right"><Badge tone="red">{p.stock} left</Badge></td>
                    <td className="px-6 py-3 text-right text-muted-foreground">{p.lowStockAt}</td>
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
