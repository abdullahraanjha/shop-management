import type { Prisma } from '@prisma/client';

/**
 * Generate a sequential, human-readable invoice number like PUR-2026-000042
 * or SAL-2026-000042. Runs inside the same transaction as the invoice insert
 * so the count is consistent. Not guaranteed gap-free (deletes create gaps),
 * which is fine for display purposes.
 */
export async function nextInvoiceNo(
  tx: Prisma.TransactionClient,
  kind: 'PUR' | 'SAL',
  year: number,
): Promise<string> {
  const count =
    kind === 'PUR'
      ? await tx.purchaseInvoice.count()
      : await tx.salesInvoice.count();
  const seq = String(count + 1).padStart(6, '0');
  return `${kind}-${year}-${seq}`;
}
