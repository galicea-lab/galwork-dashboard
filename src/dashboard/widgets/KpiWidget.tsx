import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { tasksApi } from '@/api/tasks';
import { processInstancesApi } from '@/api/processInstances';
import { notificationsApi } from '@/api/notifications';
import { extractApiError } from '@/api/client';
import type { KpiWidgetConfig } from '@/types/dashboardConfig';

/** Zob. komentarz w TaskQueueWidget.tsx - `/tasks/my` nie filtruje po modelu. */
const FETCH_LIMIT_FOR_CLIENT_FILTER = 50;

async function computeCount(config: KpiWidgetConfig): Promise<number> {
  switch (config.metric) {
    case 'task-count':
    case 'overdue-task-count': {
      const overdue = config.metric === 'overdue-task-count';
      if (config.processModelKeys?.length) {
        const page = await tasksApi.listMyTasks({ overdue, limit: FETCH_LIMIT_FOR_CLIENT_FILTER });
        return page.items.filter((item) => config.processModelKeys!.includes(item.process_model_key ?? '')).length;
      }
      const page = await tasksApi.listMyTasks({ overdue, limit: 1 });
      return page.total;
    }
    case 'process-count': {
      const page = await processInstancesApi.listProcessInstances({
        process_model_key: config.processModelKeys?.[0] ?? null,
        status: config.status ?? undefined,
        limit: 1,
      });
      return page.total;
    }
    case 'notification-count': {
      const list = await notificationsApi.listNotifications();
      return list.filter((n) => !n.read_at).length;
    }
    default:
      return 0;
  }
}

export function KpiWidget({ config }: { config: KpiWidgetConfig }) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    computeCount(config)
      .then((value) => {
        if (!cancelled) setCount(value);
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [config]);

  const content = (
    <div className="flex items-baseline gap-2">
      {error ? (
        <span className="text-xs text-rose-600">{error}</span>
      ) : (
        <span className="text-3xl font-bold text-slate-900">{count === null ? '…' : count}</span>
      )}
    </div>
  );

  if (config.href) {
    return (
      <Link href={config.href} className="block hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }
  return content;
}

export default KpiWidget;
