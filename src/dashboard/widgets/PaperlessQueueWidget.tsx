import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { paperlessDocumentsApi } from '@/api/paperlessDocuments';
import { extractApiError } from '@/api/client';
import { LoadingSpinner, EmptyState } from '@/components/common';
import type { PaperlessDocumentSummary } from '@/types/paperlessDocuments';
import type { PaperlessQueueWidgetConfig } from '@/types/dashboardConfig';

function formatDate(created?: string | null): string | null {
  if (!created) return null;
  const date = new Date(created);
  return Number.isNaN(date.getTime()) ? created : date.toLocaleDateString('pl-PL');
}

export function PaperlessQueueWidget({ config }: { config: PaperlessQueueWidgetConfig }) {
  const [items, setItems] = useState<PaperlessDocumentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    if (!config.tag.trim()) {
      setLoading(false);
      setItems([]);
      setTotal(0);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    paperlessDocumentsApi
      .listByTag(config.tag, config.limit)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
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
  }, [config.tag, config.limit]);

  if (!config.tag.trim()) {
    return (
      <EmptyState
        icon="mdi:tag-outline"
        title="Nie ustawiono tagu"
        description="Edytuj widget i podaj nazwę tagu w Paperless-ngx."
        className="p-6"
      />
    );
  }
  if (loading) {
    return <LoadingSpinner size="sm" message="Wczytywanie dokumentów..." />;
  }
  if (notConfigured) {
    return (
      <EmptyState
        icon="mdi:cog-outline"
        title="Paperless nie jest jeszcze podłączony"
        description="Skonfiguruj sekcję [paperless] w galwork-hub, aby zobaczyć tu dokumenty."
        className="p-6"
      />
    );
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (items.length === 0) {
    return <EmptyState icon="mdi:file-search-outline" title={`Brak dokumentów z tagiem "${config.tag}"`} className="p-6" />;
  }

  return (
    <div className="space-y-2">
      {items.map((doc) => (
        <a
          key={doc.id}
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors -mx-1"
        >
          <div className="min-w-0 flex items-center gap-2">
            <Icon icon="mdi:file-pdf-box" className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-xs font-medium text-slate-800 truncate hover:text-blue-600">{doc.title}</p>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">{formatDate(doc.created)}</span>
        </a>
      ))}
      {total > items.length && (
        <p className="text-[11px] text-slate-400 pt-1">
          Pokazano {items.length} z {total}
        </p>
      )}
    </div>
  );
}

export default PaperlessQueueWidget;
