import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '@/lib/api';
import type { ApiEnvelope, Settings } from '@/types';
import { Button, Card, Input, Label, Textarea, Spinner } from '@/components/ui';
import { PageHeader, Loading } from '@/components/shared';
import { useToast } from '@/components/Toast';

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Settings>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<ApiEnvelope<Settings>>('/settings')).data.data,
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => api.put('/settings', { ...form, taxRate: Number(form.taxRate ?? 0) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast('Settings saved'); },
    onError: (e) => toast(apiError(e), 'error'),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your shop details" />
      <Card className="max-w-2xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Shop Name</Label><Input value={form.shopName ?? ''} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></div>
          <div><Label>Currency</Label><Input value={form.currency ?? ''} onChange={(e) => setForm({ ...form, currency: e.target.value })} placeholder="USD" /></div>
          <div><Label>Tax Rate (%)</Label><Input type="number" step="0.01" value={form.taxRate ?? ''} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Logo URL</Label><Input value={form.logoUrl ?? ''} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Textarea value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="mt-6"><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Spinner />} Save Settings</Button></div>
      </Card>
    </div>
  );
}
