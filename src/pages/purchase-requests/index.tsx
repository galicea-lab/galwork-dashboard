import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { purchaseRequestsApi } from '@/api/purchaseRequests';
import { extractApiError } from '@/api/client';
import { Badge, EmptyState, LoadingSpinner, Pagination } from '@/components/common';
import { ProcessInstanceStatusBadge } from '@/components/process-instances';
import { PurchaseRequestRead, contactLabel } from '@/types/purchaseRequests';

function formatAmount(item: PurchaseRequestRead): string {
  const amount = item.amount_estimated.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount} ${item.currency}`;
}

export default function PurchaseRequestsPage() {
  const [items, setItems] = useState<PurchaseRequestRead[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = (nextLimit = limit, nextOffset = offset) => {
    setLoading(true);
    setError(null);
    purchaseRequestsApi
      .list(nextLimit, nextOffset)
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
      })
      .catch((err) => setError(extractApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>Wnioski zakupowe | Galwork Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Wnioski zakupowe</h1>
            <p className="text-xs text-slate-500 mt-1">
              Obszar &bdquo;Zakupy&rdquo; - zob. galwork-models-book, obszary/dzialy/zakupy.md
            </p>
          </div>
          <Link
            href="/purchase-requests/new"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Icon icon="mdi:plus" className="w-4 h-4" />
            Nowy wniosek
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Wczytywanie wniosków..." />
          ) : error ? (
            <p className="p-6 text-xs text-rose-600">{error}</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon="mdi:cart-outline"
              title="Brak wniosków zakupowych"
              description="Złóż pierwszy wniosek, aby uruchomić obieg akceptacji."
              className="p-10"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Tytuł</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Dostawca</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-600">Kwota</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Flagi</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{item.title}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{contactLabel(item.contact)}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatAmount(item)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.requires_investment_approval && (
                            <Badge variant="purple" size="sm">
                              Inwestycja
                            </Badge>
                          )}
                          {item.requires_project_owner_approval && (
                            <Badge variant="info" size="sm">
                              Projekt/MPK
                            </Badge>
                          )}
                          {item.requires_additional_approval && (
                            <Badge variant="warning" size="sm">
                              Dod. akceptacja
                            </Badge>
                          )}
                          {item.requires_tender && (
                            <Badge variant="danger" size="sm">
                              PZP
                            </Badge>
                          )}
                          {item.requires_warehouse_receipt && (
                            <Badge variant="default" size="sm">
                              Magazyn
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.process_instance ? (
                          <ProcessInstanceStatusBadge status={item.process_instance.status} size="sm" />
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.process_instance_id && (
                          <Link
                            href={`/process-instances/${item.process_instance_id}`}
                            className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            Obieg
                            <Icon icon="mdi:arrow-right" className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && total > 0 && (
            <Pagination
              total={total}
              limit={limit}
              offset={offset}
              onPageChange={(newOffset) => {
                setOffset(newOffset);
                load(limit, newOffset);
              }}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setOffset(0);
                load(newLimit, 0);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
