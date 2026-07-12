import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiEnvelope, SalesInvoice, Settings } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Loading } from '@/components/shared';

/**
 * Clean, printer-friendly sales invoice. Rendered outside the app layout so it
 * prints without the sidebar. Auto-opens the print dialog once loaded.
 */
export default function InvoicePrintPage() {
  const { id } = useParams();

  const { data: invoice } = useQuery({
    queryKey: ['print-sale', id],
    queryFn: async () => (await api.get<ApiEnvelope<SalesInvoice>>(`/sales/${id}`)).data.data,
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<ApiEnvelope<Settings>>('/settings')).data.data,
  });

  useEffect(() => {
    if (invoice) setTimeout(() => window.print(), 400);
  }, [invoice]);

  if (!invoice) return <Loading />;
  const currency = settings?.currency ?? 'USD';

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-black print:p-0">
      <style>{`@media print { body { background: white; } .no-print { display: none; } }`}</style>

      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">{settings?.shopName ?? 'My Shop'}</h1>
          {settings?.address && <p className="text-sm text-gray-600">{settings.address}</p>}
          {settings?.phone && <p className="text-sm text-gray-600">{settings.phone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold">INVOICE</h2>
          <p className="text-sm text-gray-600">{invoice.invoiceNo}</p>
          <p className="text-sm text-gray-600">{new Date(invoice.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <p><span className="font-medium">Bill To:</span> {invoice.customer?.name ?? 'Walk-in Customer'}</p>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead className="border-b text-left">
          <tr>
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{it.product?.name}</td>
              <td className="py-2 text-right">{it.quantity}</td>
              <td className="py-2 text-right">{formatCurrency(it.unitPrice ?? 0, currency)}</td>
              <td className="py-2 text-right">{formatCurrency(it.lineTotal, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(invoice.subTotal, currency)}</span></div>
          <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(invoice.discount, currency)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>+{formatCurrency(invoice.tax, currency)}</span></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><span>Total</span><span>{formatCurrency(invoice.total, currency)}</span></div>
          <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(invoice.paidAmount, currency)}</span></div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">Thank you for your business!</p>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Print Invoice
        </button>
      </div>
    </div>
  );
}
