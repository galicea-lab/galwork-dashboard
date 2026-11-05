import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { ShortcutWidgetConfig } from '@/types/dashboardConfig';

export function ShortcutWidget({ config }: { config: ShortcutWidgetConfig }) {
  return (
    <Link
      href={config.href}
      className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100">
        <Icon icon={config.icon ?? 'mdi:link-variant'} className="w-5 h-5" />
      </div>
      {config.description && <p className="text-xs text-slate-500">{config.description}</p>}
    </Link>
  );
}

export default ShortcutWidget;
