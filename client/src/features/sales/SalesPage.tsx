import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Printer } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Contact, Product, SalesInvoice } from '@/types';
import { Button, Input, Label, Select, Textarea, Badge, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';

interface Line { productId: string; quantity: number; unitPrice: number }

export default function SalesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: 1, unitPrice: 0 }]);

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, debounced],
    queryFn: async () => (await api.get<ApiEnvelope<SalesInvoice[]>>('/sales', { params: { page, limit: 10, search: debounced } })).data,
  });
  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get<ApiEnvelope<Product[]>>('/products', { params: { limit: 500 } })).data.data,
  });
  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => (await api.get<ApiEnvelope<Contact[]>>('/customers', { params: { limit: 200 } })).data.data,
  });

  // Live totals + profit preview (cost comes from the product, never entered)
  const productMap = new Map(products?.map((p) => [p.id, p]));
  const subTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const estProfit = lines.reduce((s, l) => {
    const p = productMap.get(l.productId);
    const cost = p ? Number(p.costPrice) : 0;
    return s + (l.unitPrice - cost) * l.quantity;
  }, 0) - discount;
  const total = subTotal - discount + tax;

  const create = useMutation({
    mutationFn: async () => api.post('/sales', {
      customerId: customerId || null, discount, tax, paidAmount, note,
      items: lines.filter((l) => l.productId && l.quantity > 0),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm(); setFormOpen(false); toast('Sale saved — stock reduced, profit recorded');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  function resetForm() {
    setCustomerId(''); setDiscount(0); setTax(0); setPaidAmount(0); setNote('');
    setLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
  }
  function updateLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onPickProduct(i: number, productId: string) {
    const p = productMap.get(productId);
    updateLine(i, { productId, unitPrice: p ? Number(p.sellingPrice) : 0 });
  }

  return (
    <div>
      <PageHeader title="Sales" subtitle="Record sales — stock decreases and profit is calculated automatically"
        action={<Button onClick={() => { resetForm(); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Sale</Button>} />
      <div className="mb-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoice no..." /></div>

      {isLoading ? <Loading /> : (
        <>
          <TableShell head={<tr><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Profit</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Print</th></tr>}>
            {data && data.data.length ? data.data.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{inv.invoiceNo}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.customer?.name ?? 'Walk-in'}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(inv.totalProfit)}</td>
                <td className="px-4 py-3"><Badge tone={inv.paymentStatus === 'PAID' ? 'green' : inv.paymentStatus === 'PARTIAL' ? 'yellow' : 'red'}>{inv.paymentStatus}</Badge></td>
                <td className="px-4 py-3 text-right"><Link to={`/print/sale/${inv.id}`} target="_blank"><Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button></Link></td>
              </tr>
            )) : <EmptyRow colSpan={7} message="No sales recorded yet." />}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Sale Invoice" wide
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={() => create.mutate()} disabled={create.isPending || subTotal <= 0}>{create.isPending && <Spinner />} Save Sale</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Customer</Label><Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">Walk-in customer</option>{customers?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          </div>

          <div>
            <Label>Items <span className="text-xs font-normal text-muted-foreground">(cost price is applied automatically — you only set the selling price)</span></Label>
            <div className="space-y-2">
              {lines.map((l, i) => {
                const p = productMap.get(l.productId);
                return (
                  <div key={i} className="grid grid-cols-12 items-center gap-2">
                    <Select className="col-span-5" value={l.productId} onChange={(e) => onPickProduct(i, e.target.value)}>
                      <option value="">Select product...</option>
                      {products?.map((pp) => <option key={pp.id} value={pp.id}>{pp.name} — stock {pp.stock}</option>)}
                    </Select>
                    <Input className="col-span-2" type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" />
                    <Input className="col-span-2" type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} placeholder="Price" />
                    <span className="col-span-2 text-right text-xs text-muted-foreground">{p ? `+${formatCurrency((l.unitPrice - Number(p.costPrice)) * l.quantity)}` : ''}</span>
                    <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: 1, unitPrice: 0 }])}><Plus className="h-4 w-4" /> Add Item</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div><Label>Discount</Label><Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
            <div><Label>Tax</Label><Input type="number" step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
            <div><Label>Paid Amount</Label><Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(Number(e.target.value))} /></div>
          </div>
          <div><Label>Note</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></div>

          <div className="rounded-md bg-muted/40 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subTotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{formatCurrency(discount)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>+{formatCurrency(tax)}</span></div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <div className="mt-1 flex justify-between text-green-600 dark:text-green-400"><span>Estimated Profit</span><span>{formatCurrency(estProfit)}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
