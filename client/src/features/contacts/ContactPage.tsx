import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Contact } from '@/types';
import { Button, Input, Label, Textarea, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell, ConfirmDialog } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Shared CRUD page for Customers and Suppliers — they have identical fields.
 * `resource` is the API path segment ('customers' | 'suppliers').
 */
export function ContactPage({ resource, title, subtitle }: { resource: 'customers' | 'suppliers'; title: string; subtitle: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({ name: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [resource, page, debounced],
    queryFn: async () => (await api.get<ApiEnvelope<Contact[]>>(`/${resource}`, { params: { page, limit: 10, search: debounced } })).data,
  });

  const save = useMutation({
    mutationFn: async (f: Partial<Contact>) => (f.id ? api.put(`/${resource}/${f.id}`, f) : api.post(`/${resource}`, f)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [resource] }); setOpen(false); toast('Saved'); },
    onError: (e) => toast(apiError(e), 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [resource] }); setDeleteId(null); toast('Deleted'); },
    onError: (e) => toast(apiError(e), 'error'),
  });

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}
        action={<Button onClick={() => { setForm({ name: '' }); setOpen(true); }}><Plus className="h-4 w-4" /> Add</Button>} />
      <div className="mb-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or phone..." /></div>

      {isLoading ? <Loading /> : (
        <>
          <TableShell head={<tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Address</th><th className="px-4 py-3 text-right">Actions</th></tr>}>
            {data && data.data.length ? data.data.map((c) => (
              <tr key={c.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.address || '—'}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setForm(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            )) : <EmptyRow colSpan={5} message="Nothing here yet." />}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit' : 'Add New'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending && <Spinner />} Save</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Textarea value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete" message="Delete this record? Records with transaction history cannot be deleted."
        onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} loading={remove.isPending} />
    </div>
  );
}
