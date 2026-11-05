import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { processInstancesApi } from '@/api/processInstances';
import { extractApiError } from '@/api/client';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { ProcessInstanceStatusBadge } from '@/components/process-instances/ProcessInstanceStatusBadge';
import type { ProcessInstanceRead } from '@/types/processInstances';
import type { ProcessListWidgetConfig } from '@/types/dashboardConfig';

function getByPath(summary: Record<string, unknown>, path: string): string {
  const value = path
    .split('.')
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), summary);
  if (value === undefined || value === null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function ProcessListWidget({ config }: { config: ProcessListWidgetConfig }) {
  const [items, setItems] = useState<ProcessInstanceRead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processModelKey = config.processModelKeys?.[0] ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    processInstancesApi
      .listProcessInstances({
        process_model_key: processModelKey,
        status: config.status ?? undefined,
        limit: config.limit,
      })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [processModelKey, config.status, config.limit]);

  if (loading) {
    return <LoadingSpinner size="sm" message="Wczytywanie instancji..." />;
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (items.length === 0) {
    return <EmptyState icon="mdi:file-tree-outline" title="Brak instancji" className="p-6" />;
  }

  return (
    <div className="space-y-2">
      {items.map((instance) => (
        <Link
          key={instance.id}
          href={`/process-instances/${instance.id}`}
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors -mx-1"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-800 truncate">{instance.title}</p>
            {config.columns.length > 0 && (
              <p className="text-[11px] text-slate-500 truncate">
                {config.columns
                  .map((col) => `${col.label}: ${getByPath(instance.summary, col.path)}`)
                  .join(' · ')}
              </p>
            )}
          </div>
          <ProcessInstanceStatusBadge status={instance.status} size="sm" />
        </Link>
      ))}
      {total > items.length && (
        <Link
          href="/process-instances"
          className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 pt-1"
        >
          Zobacz wszystkie ({total}) <Icon icon="mdi:arrow-right" className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default ProcessListWidget;
