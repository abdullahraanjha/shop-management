import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Category, Product } from '@/types';
import { Button, Input, Label, Select, Badge, Textarea, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell, ConfirmDialog } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';

type FormState = Partial<Product>;

const empty: FormState = { name: '', sku: '', costPrice: '0', sellingPrice: '0', stock: 0, lowStockAt: 10, unit: 'pcs' };

export default function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, debounced],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Product[]>>('/products', { params: { page, limit: 10, search: debounced } });
      return res.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => (await api.get<ApiEnvelope<Category[]>>('/categories', { params: { limit: 100 } })).data.data,
  });

  const save = useMutation({
    mutationFn: async (payload: FormState) => {
      const body = {
        ...payload,
        costPrice: Number(payload.costPrice),
        sellingPrice: Number(payload.sellingPrice),
        stock: Number(payload.stock),
        lowStockAt: Number(payload.lowStockAt),
        categoryId: payload.categoryId || null,
      };
      if (payload.id) return api.put(`/products/${payload.id}`, body);
      return api.post('/products', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      toast('Product saved');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
      toast('Product deleted');
    },
    onError: (e) => toast(apiError(e), 'error'),
  });

  function openNew() { setForm(empty); setModalOpen(true); }
  function openEdit(p: Product) { setForm(p); setModalOpen(true); }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your inventory catalog"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Add Product</Button>}
      />

      <div className="mb-4">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, SKU, barcode..." />
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <>
          <TableShell
            head={
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            }
          >
            {data && data.data.length > 0 ? (
              data.data.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {!p.isActive && <Badge tone="red">inactive</Badge>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.costPrice)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    {p.stock <= p.lowStockAt ? <Badge tone="red">{p.stock}</Badge> : <span>{p.stock}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyRow colSpan={7} message="No products found. Add your first product." />
            )}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Edit Product' : 'Add Product'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending && <Spinner />} Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Name</Label>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={form.sku ?? ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <Label>Barcode</Label>
            <Input value={form.barcode ?? ''} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.categoryId ?? ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">— None —</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Unit</Label>
            <Input value={form.unit ?? 'pcs'} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <Label>Cost Price</Label>
            <Input type="number" step="0.01" value={form.costPrice ?? ''} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          </div>
          <div>
            <Label>Selling Price</Label>
            <Input type="number" step="0.01" value={form.sellingPrice ?? ''} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
          </div>
          <div>
            <Label>Opening Stock</Label>
            <Input type="number" value={form.stock ?? 0} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} disabled={!!form.id} />
            {form.id && <p className="mt-1 text-xs text-muted-foreground">Stock changes via purchases/sales.</p>}
          </div>
          <div>
            <Label>Low Stock Alert At</Label>
            <Input type="number" value={form.lowStockAt ?? 10} onChange={(e) => setForm({ ...form, lowStockAt: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Product"
        message="Delete this product? If it has purchase/sale history it will be deactivated instead."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
        loading={remove.isPending}
      />
    </div>
  );
}
