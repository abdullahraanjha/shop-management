import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiEnvelope } from '@/types';
import { Card, Input, Label } from '@/components/ui';
import { PageHeader, StatCard, Loading } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, Wallet, Boxes } from 'lucide-react';

type Tab = 'profit-loss' | 'sales' | 'purchases' | 'inventory';
const tabs: { key: Tab; label: string }[] = [
  { key: 'profit-loss', label: 'Profit & Loss' },
  { key: 'sales', label: 'Sales' },
  { key: 'purchases', label: 'Purchases' },
  { key: 'inventory', label: 'Inventory' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('profit-loss');
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ['report', tab, from, to],
    queryFn: async () => {
      const params = tab === 'inventory' ? {} : { from, to };
      return (await api.get<ApiEnvelope<any>>(`/reports/${tab}`, { params })).data.data;
    },
  });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Analyze your shop's financials" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-md border border-border p-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('rounded px-3 py-1.5 text-sm font-medium transition-colors', tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'inventory' && (
          <div className="flex items-end gap-2">
            <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </div>
        )}
      </div>

      {isLoading || !data ? <Loading /> : (
        <>
          {tab === 'profit-loss' && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Revenue" value={formatCurrency(data.revenue)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
              <StatCard label="Gross Profit" value={formatCurrency(data.grossProfit)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
              <StatCard label="Expenses" value={formatCurrency(data.totalExpenses)} icon={<Wallet className="h-5 w-5" />} tone="red" />
              <StatCard label="Net Profit" value={formatCurrency(data.netProfit)} icon={<TrendingUp className="h-5 w-5" />} tone={data.netProfit >= 0 ? 'green' : 'red'} />
            </div>
          )}

          {tab === 'sales' && (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Sales" value={formatCurrency(data.totalSales)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
                <StatCard label="Total Profit" value={formatCurrency(data.totalProfit)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
                <StatCard label="Invoices" value={String(data.invoiceCount)} icon={<Boxes className="h-5 w-5" />} tone="blue" />
              </div>
              <ReportTable
                head={['Invoice #', 'Customer', 'Date', 'Total', 'Profit']}
                rows={(data.invoices ?? []).map((i: any) => [i.invoiceNo, i.customer?.name ?? 'Walk-in', new Date(i.createdAt).toLocaleDateString(), formatCurrency(i.total), formatCurrency(i.totalProfit)])}
              />
            </>
          )}

          {tab === 'purchases' && (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <StatCard label="Total Purchases" value={formatCurrency(data.totalPurchases)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
                <StatCard label="Invoices" value={String(data.invoiceCount)} icon={<Boxes className="h-5 w-5" />} tone="blue" />
              </div>
              <ReportTable
                head={['Invoice #', 'Supplier', 'Date', 'Total']}
                rows={(data.invoices ?? []).map((i: any) => [i.invoiceNo, i.supplier?.name ?? '—', new Date(i.createdAt).toLocaleDateString(), formatCurrency(i.total)])}
              />
            </>
          )}

          {tab === 'inventory' && (
            <>
              <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Products" value={String(data.productCount)} icon={<Boxes className="h-5 w-5" />} tone="blue" />
                <StatCard label="Stock Value (cost)" value={formatCurrency(data.stockValue)} icon={<DollarSign className="h-5 w-5" />} tone="primary" />
                <StatCard label="Retail Value" value={formatCurrency(data.retailValue)} icon={<DollarSign className="h-5 w-5" />} tone="green" />
                <StatCard label="Potential Profit" value={formatCurrency(data.potentialProfit)} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
              </div>
              <ReportTable
                head={['Product', 'Category', 'Stock', 'Cost', 'Stock Value']}
                rows={(data.products ?? []).map((p: any) => [p.name, p.category?.name ?? '—', String(p.stock), formatCurrency(p.costPrice), formatCurrency(p.stock * Number(p.costPrice))])}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function ReportTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>{head.map((h, i) => <th key={i} className={cn('px-4 py-3', i >= 3 && 'text-right')}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length ? rows.map((r, i) => (
              <tr key={i} className="hover:bg-muted/30">
                {r.map((c, j) => <td key={j} className={cn('px-4 py-3', j >= 3 && 'text-right')}>{c}</td>)}
              </tr>
            )) : <tr><td colSpan={head.length} className="py-10 text-center text-muted-foreground">No data in this range.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
