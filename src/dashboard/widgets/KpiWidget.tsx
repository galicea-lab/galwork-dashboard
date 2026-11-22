import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { extractApiError } from '@/api/client';
import { computeCount } from '@/api/metrics';
import type { KpiWidgetConfig } from '@/types/dashboardConfig';

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
