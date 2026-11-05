import React, { useEffect, useState } from 'react';
import { erpnextInvoicesApi } from '@/api/erpnextInvoices';
import { extractApiError } from '@/api/client';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '@/components/common';
import type { PurchaseInvoiceSummary } from '@/types/erpnextInvoices';
import type { InvoiceQueueWidgetConfig } from '@/types/dashboardConfig';

function formatAmount(invoice: PurchaseInvoiceSummary): string | null {
  if (invoice.grand_total == null) return null;
  const amount = invoice.grand_total.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return invoice.currency ? `${amount} ${invoice.currency}` : amount;
}

export function InvoiceQueueWidget({ config }: { config: InvoiceQueueWidgetConfig }) {
  const [items, setItems] = useState<PurchaseInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<PurchaseInvoiceSummary | null>(null);
  const [approvingName, setApprovingName] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    erpnextInvoicesApi
      .listPendingApproval(config.limit)
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 503) {
          setNotConfigured(true);
        } else {
          setError(extractApiError(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.limit]);

  const handleApprove = async () => {
    if (!confirmTarget) return;
    const { name } = confirmTarget;
    setApprovingName(name);
    setActionError(null);
    try {
      await erpnextInvoicesApi.approve(name);
      setItems((prev) => prev.filter((item) => item.name !== name));
      setConfirmTarget(null);
    } catch (err) {
      setActionError(extractApiError(err));
    } finally {
      setApprovingName(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="sm" message="Wczytywanie faktur..." />;
  }
  if (notConfigured) {
    return (
      <EmptyState
        icon="mdi:cog-outline"
        title="ERPNext nie jest jeszcze podłączony"
        description="Skonfiguruj sekcję [erpnext] w galwork-hub, aby zobaczyć tu faktury do zatwierdzenia."
        className="p-6"
      />
    );
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (items.length === 0) {
    return <EmptyState icon="mdi:receipt-text-check-outline" title="Brak faktur do zatwierdzenia" className="p-6" />;
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((invoice) => (
          <div key={invoice.name} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors -mx-1">
            <a href={invoice.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate hover:text-blue-600">{invoice.title}</p>
              <p className="text-[11px] text-slate-500 truncate">{invoice.workflow_state}</p>
            </a>
            <span className="text-xs font-semibold text-slate-700 shrink-0">{formatAmount(invoice)}</span>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setConfirmTarget(invoice);
              }}
              disabled={approvingName === invoice.name}
              className="shrink-0 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
            >
              {approvingName === invoice.name ? '...' : 'Zatwierdź'}
            </button>
          </div>
        ))}
      </div>

      {actionError && <p className="text-xs text-rose-600 mt-2">{actionError}</p>}

      <ConfirmDialog
        isOpen={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleApprove}
        title="Zatwierdzić fakturę?"
        message={
          confirmTarget
            ? `Faktura "${confirmTarget.title}" zostanie zatwierdzona w ERPNext (akcja workflow "Zatwierdź"). Tej operacji nie można wycofać z tego miejsca.`
            : ''
        }
        confirmText="Zatwierdź"
        variant="primary"
        loading={approvingName === confirmTarget?.name}
      />
    </>
  );
}

export default InvoiceQueueWidget;
