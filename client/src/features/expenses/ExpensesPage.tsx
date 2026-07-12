import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Expense } from '@/types';
import { Button, Input, Label, Select, Textarea, Spinner } from '@/components/ui';
import { Modal } from '@/components/Modal';
import { PageHeader, SearchBox, Pagination, Loading, EmptyRow, TableShell, ConfirmDialog } from '@/components/shared';
import { useToast } from '@/components/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';

const CATEGORIES = ['General', 'Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance'];

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({ title: '', category: 'General', amount: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, debounced],
    queryFn: async () => (await api.get<ApiEnvelope<Expense[]>>('/expenses', { params: { page, limit: 10, search: debounced } })).data,
  });

  const save = useMutation({
    mutationFn: async (f: Partial<Expense>) => {
      const body = { ...f, amount: Number(f.amount) };
      return f.id ? api.put(`/expenses/${f.id}`, body) : api.post('/expenses', body);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setOpen(false); toast('Expense saved'); },
    onError: (e) => toast(apiError(e), 'error'),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setDeleteId(null); toast('Expense deleted'); },
    onError: (e) => toast(apiError(e), 'error'),
  });

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track your operating costs"
        action={<Button onClick={() => { setForm({ title: '', category: 'General', amount: '' }); setOpen(true); }}><Plus className="h-4 w-4" /> Add Expense</Button>} />
      <div className="mb-4"><SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} /></div>

      {isLoading ? <Loading /> : (
        <>
          <TableShell head={<tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3 text-right">Actions</th></tr>}>
            {data && data.data.length ? data.data.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(e.spentAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setForm({ ...e, spentAt: e.spentAt.slice(0, 10) }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div></td>
              </tr>
            )) : <EmptyRow colSpan={5} message="No expenses recorded." />}
          </TableShell>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Expense' : 'Add Expense'}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save.mutate(form)} disabled={save.isPending}>{save.isPending && <Spinner />} Save</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Category</Label><Select value={form.category ?? 'General'} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
          <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><Label>Date</Label><Input type="date" value={form.spentAt ?? ''} onChange={(e) => setForm({ ...form, spentAt: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Note</Label><Textarea value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} title="Delete Expense" message="Delete this expense record?"
        onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutate(deleteId)} loading={remove.isPending} />
    </div>
  );
}
