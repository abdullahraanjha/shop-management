import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Category } from '@/types';
import { Button, Input, Label, Textarea, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell, ConfirmDialog } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Category>>({ name: '', description: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, debounced],
    queryFn: async () => (await api.get<ApiEnvelope<Category[]>>('/categories', { params: { page, limit: 10, search: debounced } })).data,
  });

  const save = useMutation({
    mutationFn: async (f: Partial<Category>) =>
      f.id ? api.put(`/categories/${f.id}`, f) : api.post('/categories', f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setOpen(false); toast('Category saved'); },
    onError: (e) => toast(apiError(e), 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setDeleteId(null); toast('Category deleted'); },
    onError: (e) => toast(apiError(e), 'error'),
  });

  return (
    <div>
      <PageHeader title="Categories" subtitle="Group your products"
        action={<Button onClick={() => { setForm({ name: '', description: '' }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Category</Button>} />
      <div className="mb-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} /></div>

      {isLoading ? <Loading /> : (
        <>
          <TableShell head={<tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Products</th><th className="px-4 py-3 text-right">Actions</th></tr>}>
            {data && data.data.length ? data.data.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.description || '—'}</td>
                <td className="px-4 py-3 text-right">{c._count?.products ?? 0}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setForm(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            )) : <EmptyRow colSpan={4} message="No categories yet." />}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Category' : 'Add Category'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending && <Spinner />} Save</Button></>}>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Category" message="Delete this category? Categories with products cannot be deleted."
        onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} loading={remove.isPending} />
    </div>
  );
}
