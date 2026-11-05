import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { tasksApi } from '@/api/tasks';
import { extractApiError } from '@/api/client';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge';
import type { MyTaskItem } from '@/types/tasks';
import type { TaskQueueWidgetConfig } from '@/types/dashboardConfig';

/**
 * `/v1/wf/tasks/my` nie filtruje po `process_model_key` (tylko
 * `only_claimed`/`overdue`) - pobieramy trochę więcej zadań niż `limit`
 * (ale rozsądnie ograniczoną liczbę) i filtrujemy po modelu po stronie
 * klienta. Dla dashboardowego widgetu to wystarczające; jeśli w przyszłości
 * okaże się, że użytkownicy mają dziesiątki otwartych zadań poza
 * pierwszą stroną, filtr będzie trzeba przenieść do backendu.
 */
const FETCH_LIMIT_FOR_CLIENT_FILTER = 50;

export function TaskQueueWidget({ config }: { config: TaskQueueWidgetConfig }) {
  const [items, setItems] = useState<MyTaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const needsClientFilter = !!config.processModelKeys?.length;
    tasksApi
      .listMyTasks({
        only_claimed: config.onlyClaimed,
        overdue: config.overdueOnly,
        limit: needsClientFilter ? FETCH_LIMIT_FOR_CLIENT_FILTER : config.limit,
      })
      .then((page) => {
        if (cancelled) return;
        const filtered = needsClientFilter
          ? page.items.filter((item) => config.processModelKeys!.includes(item.process_model_key ?? ''))
          : page.items;
        setItems(filtered.slice(0, config.limit));
        setTotal(needsClientFilter ? filtered.length : page.total);
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
  }, [config.processModelKeys, config.onlyClaimed, config.overdueOnly, config.limit]);

  if (loading) {
    return <LoadingSpinner size="sm" message="Wczytywanie zadań..." />;
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (items.length === 0) {
    return <EmptyState icon="mdi:check-all" title="Brak zadań" className="p-6" />;
  }

  return (
    <div className="space-y-2">
      {items.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors -mx-1"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">{task.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{task.process_title}</p>
          </div>
          <TaskPriorityBadge priority={task.priority} size="sm" />
        </Link>
      ))}
      {total > items.length && (
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 pt-1"
        >
          Zobacz wszystkie ({total}) <Icon icon="mdi:arrow-right" className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default TaskQueueWidget;
