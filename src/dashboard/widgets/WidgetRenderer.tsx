import React from 'react';
import type { WidgetConfig } from '@/types/dashboardConfig';
import { WidgetFrame } from './WidgetFrame';
import { TaskQueueWidget } from './TaskQueueWidget';
import { ProcessListWidget } from './ProcessListWidget';
import { KpiWidget } from './KpiWidget';
import { ShortcutWidget } from './ShortcutWidget';
import { InvoiceQueueWidget } from './InvoiceQueueWidget';
import { PaperlessQueueWidget } from './PaperlessQueueWidget';
import { RelatedAppsWidget } from './RelatedAppsWidget';

interface WidgetRendererProps {
  config: WidgetConfig;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function WidgetBody({ config }: { config: WidgetConfig }) {
  switch (config.type) {
    case 'task-queue':
      return <TaskQueueWidget config={config} />;
    case 'process-list':
      return <ProcessListWidget config={config} />;
    case 'kpi':
      return <KpiWidget config={config} />;
    case 'shortcut':
      return <ShortcutWidget config={config} />;
    case 'invoice-queue':
      return <InvoiceQueueWidget config={config} />;
    case 'paperless-queue':
      return <PaperlessQueueWidget config={config} />;
    case 'related-apps':
      return <RelatedAppsWidget config={config} />;
    default:
      return null;
  }
}

export function WidgetRenderer({
  config,
  editMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
}: WidgetRendererProps) {
  return (
    <WidgetFrame
      icon={config.icon}
      title={config.title}
      size={config.size}
      editMode={editMode}
      isFirst={isFirst}
      isLast={isLast}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      onEdit={onEdit}
      onRemove={onRemove}
    >
      <WidgetBody config={config} />
    </WidgetFrame>
  );
}

export default WidgetRenderer;
