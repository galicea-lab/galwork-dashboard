import React, { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import type { WidgetSize } from '@/types/dashboardConfig';

export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: 'col-span-1',
  md: 'col-span-1 sm:col-span-2',
  lg: 'col-span-1 sm:col-span-2 lg:col-span-3',
  full: 'col-span-1 sm:col-span-2 lg:col-span-4',
};

interface WidgetFrameProps {
  icon?: string;
  title: string;
  size: WidgetSize;
  editMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  children: ReactNode;
}

const ICON_BTN =
  'inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

export function WidgetFrame({
  icon,
  title,
  size,
  editMode = false,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  children,
}: WidgetFrameProps) {
  return (
    <div
      className={`${WIDGET_SIZE_CLASSES[size]} rounded-xl border bg-white shadow-sm p-4 sm:p-5 flex flex-col ${
        editMode ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <Icon icon={icon} className="w-4 h-4 text-blue-600 shrink-0" />}
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide truncate">
            {title}
          </h3>
        </div>
        {editMode && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button type="button" className={ICON_BTN} disabled={isFirst} onClick={onMoveUp} aria-label="Przesuń wcześniej" title="Przesuń wcześniej">
              <Icon icon="mdi:arrow-up" className="w-3.5 h-3.5" />
            </button>
            <button type="button" className={ICON_BTN} disabled={isLast} onClick={onMoveDown} aria-label="Przesuń później" title="Przesuń później">
              <Icon icon="mdi:arrow-down" className="w-3.5 h-3.5" />
            </button>
            <button type="button" className={ICON_BTN} onClick={onEdit} aria-label="Edytuj widget" title="Edytuj widget">
              <Icon icon="mdi:pencil-outline" className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-600`}
              onClick={onRemove}
              aria-label="Usuń widget"
              title="Usuń widget"
            >
              <Icon icon="mdi:close" className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export default WidgetFrame;
