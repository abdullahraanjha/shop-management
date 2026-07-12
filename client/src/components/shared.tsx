import { type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button, Card, Input, Spinner } from './ui';
import { Modal } from './Modal';
import type { PaginationMeta } from '@/types';

/* ── Page header with optional action ───────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── KPI stat card ──────────────────────────────────────────────────────── */
export function StatCard({
  label, value, icon, hint, tone = 'primary', delta, hero,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  hint?: string;
  tone?: 'primary' | 'green' | 'red' | 'blue' | 'amber';
  /** e.g. "+12.5%" — rendered as a trend chip */
  delta?: string;
  /** gradient lead-metric variant */
  hero?: boolean;
}) {
  const tones = {
    primary: 'text-indigo-500 bg-indigo-500/10',
    green: 'text-emerald-500 bg-emerald-500/10',
    red: 'text-rose-500 bg-rose-500/10',
    blue: 'text-sky-500 bg-sky-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
  };
  const deltaUp = delta?.startsWith('+');

  if (hero) {
    return (
      <Card className="hero-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">{label}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
            {hint && <p className="mt-1.5 text-xs text-white/70">{hint}</p>}
          </div>
          <div className="rounded-xl bg-white/15 p-2.5 backdrop-blur">{icon}</div>
        </div>
        {delta && (
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
            {delta} vs yesterday
          </span>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {delta && (
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${deltaUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {delta}
              </span>
            )}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
        <div className={`rounded-xl p-2.5 ${tones[tone]}`}>{icon}</div>
      </div>
    </Card>
  );
}

/* ── Search box ─────────────────────────────────────────────────────────── */
export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search...'}
        className="pl-9"
      />
    </div>
  );
}

/* ── Pagination controls ────────────────────────────────────────────────── */
export function Pagination({ meta, onPage }: { meta?: PaginationMeta; onPage: (p: number) => void }) {
  if (!meta || meta.total === 0) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ── Loading / empty states ─────────────────────────────────────────────── */
export function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Spinner className="!h-6 !w-6" />
    </div>
  );
}
export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}

/* ── Confirm dialog ─────────────────────────────────────────────────────── */
export function ConfirmDialog({
  open, title, message, onConfirm, onCancel, loading,
}: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading && <Spinner />} Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}

/* ── Table shell ────────────────────────────────────────────────────────── */
export function TableShell({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            {head}
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </Card>
  );
}
