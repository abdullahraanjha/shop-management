import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Eye } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Contact, Product, PurchaseInvoice } from '@/types';
import { Button, Input, Label, Select, Textarea, Badge, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';

interface Line { productId: string; quantity: number; unitCost: number }

export default function PurchasesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: 1, unitCost: 0 }]);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, debounced],
    queryFn: async () => (await api.get<ApiEnvelope<PurchaseInvoice[]>>('/purchases', { params: { page, limit: 10, search: debounced } })).data,
  });
  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => (await api.get<ApiEnvelope<Product[]>>('/products', { params: { limit: 500 } })).data.data,
  });
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => (await api.get<ApiEnvelope<Contact[]>>('/suppliers', { params: { limit: 200 } })).data.data,
  });
  const { data: viewInvoice } = useQuery({
    queryKey: ['purchase', viewId],
    enabled: !!viewId,
    queryFn: async () => (await api.get<ApiEnvelope<PurchaseInvoice>>(`/purchases/${viewId}`)).data.data,
  });

  const subTotal = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const total = subTotal - discount + tax;

  const create = useMutation({
    mutationFn: async () => api.post('/purchases', {
      supplierId: supplierId || null, discount, tax, paidAmount, note,
      items: lines.filter((l) => l.productId && l.quantity > 0),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      resetForm(); setFormOpen(false); toast('Purchase saved — stock increased');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  function resetForm() {
    setSupplierId(''); setDiscount(0); setTax(0); setPaidAmount(0); setNote('');
    setLines([{ productId: '', quantity: 1, unitCost: 0 }]);
  }
  function updateLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function onPickProduct(i: number, productId: string) {
    const p = products?.find((x) => x.id === productId);
    updateLine(i, { productId, unitCost: p ? Number(p.costPrice) : 0 });
  }

  return (
    <div>
      <PageHeader title="Purchases" subtitle="Record stock purchases — inventory increases automatically"
        action={<Button onClick={() => { resetForm(); setFormOpen(true); }}><Plus className="h-4 w-4" /> New Purchase</Button>} />
      <div className="mb-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoice no..." /></div>

      {isLoading ? <Loading /> : (
        <>
          <TableShell head={<tr><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Items</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">View</th></tr>}>
            {data && data.data.length ? data.data.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{inv.invoiceNo}</td>
                <td className="px-4 py-3 text-muted-foreground">{inv.supplier?.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">{inv._count?.items ?? 0}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total)}</td>
                <td className="px-4 py-3"><Badge tone={inv.paymentStatus === 'PAID' ? 'green' : inv.paymentStatus === 'PARTIAL' ? 'yellow' : 'red'}>{inv.paymentStatus}</Badge></td>
                <td className="px-4 py-3 text-right"><Button variant="ghost" size="icon" onClick={() => setViewId(inv.id)}><Eye className="h-4 w-4" /></Button></td>
              </tr>
            )) : <EmptyRow colSpan={7} message="No purchases recorded yet." />}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {/* New purchase form */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="New Purchase Invoice" wide
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={() => create.mutate()} disabled={create.isPending || subTotal <= 0}>{create.isPending && <Spinner />} Save Purchase</Button></>}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Supplier</Label><Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">— None —</option>{suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
          </div>

          <div>
            <Label>Items</Label>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <Select className="col-span-6" value={l.productId} onChange={(e) => onPickProduct(i, e.target.value)}>
                    <option value="">Select product...</option>
                    {products?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </Select>
                  <Input className="col-span-2" type="number" min={1} value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} placeholder="Qty" />
                  <Input className="col-span-3" type="number" step="0.01" value={l.unitCost} onChange={(e) => updateLine(i, { unitCost: Number(e.target.value) })} placeholder="Unit cost" />
                  <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setLines((ls) => [...ls, { productId: '', quantity: 1, unitCost: 0 }])}><Plus className="h-4 w-4" /> Add Item</Button>
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
          </div>
        </div>
      </Modal>

      {/* View invoice */}
      <Modal open={!!viewId} onClose={() => setViewId(null)} title={viewInvoice?.invoiceNo ?? 'Invoice'} wide>
        {!viewInvoice ? <Loading /> : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Supplier: {viewInvoice.supplier?.name ?? '—'}</span>
              <span>{new Date(viewInvoice.createdAt).toLocaleString()}</span>
            </div>
            <table className="w-full">
              <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Product</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit Cost</th><th className="py-2 text-right">Total</th></tr></thead>
              <tbody className="divide-y divide-border">
                {viewInvoice.items?.map((it) => (
                  <tr key={it.id}><td className="py-2">{it.product?.name}</td><td className="py-2 text-right">{it.quantity}</td><td className="py-2 text-right">{formatCurrency(it.unitCost ?? 0)}</td><td className="py-2 text-right">{formatCurrency(it.lineTotal)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end"><span className="font-semibold">Total: {formatCurrency(viewInvoice.total)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
