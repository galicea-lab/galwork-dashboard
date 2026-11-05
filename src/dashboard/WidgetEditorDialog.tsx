import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProcessModels } from '@/store/processModels';
import type {
  InvoiceQueueWidgetConfig,
  KpiMetric,
  KpiWidgetConfig,
  PaperlessQueueWidgetConfig,
  RelatedAppsWidgetConfig,
  ProcessListWidgetConfig,
  ShortcutWidgetConfig,
  TaskQueueWidgetConfig,
  WidgetConfig,
  WidgetSize,
} from '@/types/dashboardConfig';
import { DEFAULT_RELATED_APPS_SOURCE } from '@/types/dashboardConfig';
import type { ProcessInstanceStatus } from '@/types/processInstances';
import { WIDGET_CATALOG } from './catalog';

const SIZE_OPTIONS: { value: WidgetSize; label: string }[] = [
  { value: 'sm', label: 'Małe' },
  { value: 'md', label: 'Średnie' },
  { value: 'lg', label: 'Duże' },
  { value: 'full', label: 'Pełna szerokość' },
];

const STATUS_OPTIONS: { value: ProcessInstanceStatus; label: string }[] = [
  { value: 'running', label: 'W trakcie' },
  { value: 'waiting', label: 'Oczekuje' },
  { value: 'suspended', label: 'Wstrzymany' },
  { value: 'completed', label: 'Zakończony' },
  { value: 'cancelled', label: 'Anulowany' },
  { value: 'error', label: 'Błąd' },
];

const KPI_METRIC_OPTIONS: { value: KpiMetric; label: string }[] = [
  { value: 'task-count', label: 'Liczba moich zadań' },
  { value: 'overdue-task-count', label: 'Liczba przeterminowanych zadań' },
  { value: 'process-count', label: 'Liczba instancji procesu' },
  { value: 'notification-count', label: 'Liczba nieprzeczytanych powiadomień' },
];

const FIELD_LABEL = 'block text-xs font-medium text-slate-600 mb-1';
const TEXT_INPUT =
  'w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

interface WidgetEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WidgetConfig) => void;
  /** Widget edytowany, lub null/undefined przy dodawaniu nowego (pokazujemy wybór typu). */
  initial?: WidgetConfig | null;
}

export function WidgetEditorDialog({ isOpen, onClose, onSave, initial }: WidgetEditorDialogProps) {
  const dispatch = useAppDispatch();
  const processModels = useAppSelector((state) => state.processModels.items);
  const [draft, setDraft] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(initial ?? null);
      if (processModels.length === 0) {
        dispatch(fetchProcessModels({ active_only: true }));
      }
    }
  }, [isOpen, initial, dispatch, processModels.length]);

  if (!isOpen) {
    return null;
  }

  if (!draft) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Dodaj widget" subtitle="Wybierz typ widgetu do dodania na pulpit">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WIDGET_CATALOG.map((entry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => setDraft(entry.createDefault())}
              className="flex items-start gap-3 text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Icon icon={entry.icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">{entry.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{entry.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  const update = <T extends WidgetConfig>(patch: Partial<T>) => setDraft((prev) => ({ ...(prev as T), ...patch }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Edytuj widget' : 'Skonfiguruj widget'}
      maxWidth="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={!draft.title.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Zapisz
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div>
            <label className={FIELD_LABEL}>Tytuł</label>
            <input
              className={TEXT_INPUT}
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>
          <div>
            <label className={FIELD_LABEL}>Rozmiar</label>
            <select
              className={TEXT_INPUT}
              value={draft.size}
              onChange={(e) => update({ size: e.target.value as WidgetSize })}
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {draft.type === 'task-queue' && (
          <TaskQueueFields config={draft} processModels={processModels} onChange={update} />
        )}
        {draft.type === 'process-list' && (
          <ProcessListFields config={draft} processModels={processModels} onChange={update} />
        )}
        {draft.type === 'kpi' && <KpiFields config={draft} processModels={processModels} onChange={update} />}
        {draft.type === 'shortcut' && <ShortcutFields config={draft} onChange={update} />}
        {draft.type === 'invoice-queue' && <InvoiceQueueFields config={draft} onChange={update} />}
        {draft.type === 'paperless-queue' && <PaperlessQueueFields config={draft} onChange={update} />}
        {draft.type === 'related-apps' && <RelatedAppsFields config={draft} onChange={update} />}
      </div>
    </Modal>
  );
}

interface ProcessModelOption {
  key: string;
  name: string;
}

function ProcessModelCheckboxes({
  processModels,
  selected,
  onChange,
}: {
  processModels: ProcessModelOption[];
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };
  if (processModels.length === 0) {
    return <p className="text-[11px] text-slate-400">Brak dostępnych modeli procesów.</p>;
  }
  return (
    <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-100 rounded-lg p-2">
      {processModels.map((model) => (
        <label key={model.key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={selected.includes(model.key)}
            onChange={() => toggle(model.key)}
          />
          {model.name}
        </label>
      ))}
    </div>
  );
}

function TaskQueueFields({
  config,
  processModels,
  onChange,
}: {
  config: TaskQueueWidgetConfig;
  processModels: ProcessModelOption[];
  onChange: (patch: Partial<TaskQueueWidgetConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={FIELD_LABEL}>Ogranicz do modeli procesów (puste = wszystkie)</label>
        <ProcessModelCheckboxes
          processModels={processModels}
          selected={config.processModelKeys ?? []}
          onChange={(keys) => onChange({ processModelKeys: keys.length ? keys : undefined })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
            checked={!!config.onlyClaimed}
            onChange={(e) => onChange({ onlyClaimed: e.target.checked })}
          />
          Tylko podjęte przeze mnie
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
            checked={!!config.overdueOnly}
            onChange={(e) => onChange({ overdueOnly: e.target.checked })}
          />
          Tylko przeterminowane
        </label>
        <div className="w-24">
          <label className={FIELD_LABEL}>Limit</label>
          <input
            type="number"
            min={1}
            max={20}
            className={TEXT_INPUT}
            value={config.limit}
            onChange={(e) => onChange({ limit: Number(e.target.value) || 1 })}
          />
        </div>
      </div>
    </div>
  );
}

function ProcessListFields({
  config,
  processModels,
  onChange,
}: {
  config: ProcessListWidgetConfig;
  processModels: ProcessModelOption[];
  onChange: (patch: Partial<ProcessListWidgetConfig>) => void;
}) {
  const addColumn = () => onChange({ columns: [...config.columns, { label: '', path: '' }] });
  const updateColumn = (index: number, patch: Partial<{ label: string; path: string }>) => {
    const columns = config.columns.map((col, i) => (i === index ? { ...col, ...patch } : col));
    onChange({ columns });
  };
  const removeColumn = (index: number) => onChange({ columns: config.columns.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={FIELD_LABEL}>Model procesu (puste = wszystkie)</label>
          <select
            className={TEXT_INPUT}
            value={config.processModelKeys?.[0] ?? ''}
            onChange={(e) => onChange({ processModelKeys: e.target.value ? [e.target.value] : undefined })}
          >
            <option value="">Wszystkie modele</option>
            {processModels.map((model) => (
              <option key={model.key} value={model.key}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={FIELD_LABEL}>Status (puste = wszystkie)</label>
          <select
            className={TEXT_INPUT}
            value={config.status ?? ''}
            onChange={(e) => onChange({ status: (e.target.value || null) as ProcessInstanceStatus | null })}
          >
            <option value="">Wszystkie statusy</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={FIELD_LABEL + ' mb-0'}>Kolumny z danych procesu (pole w summary)</label>
          <button type="button" onClick={addColumn} className="text-[11px] font-medium text-blue-600 hover:text-blue-700">
            + Dodaj kolumnę
          </button>
        </div>
        <div className="space-y-2">
          {config.columns.map((col, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className={TEXT_INPUT}
                placeholder="Etykieta (np. Kwota)"
                value={col.label}
                onChange={(e) => updateColumn(index, { label: e.target.value })}
              />
              <input
                className={TEXT_INPUT}
                placeholder="Pole (np. kwota, nadawca.nazwa)"
                value={col.path}
                onChange={(e) => updateColumn(index, { path: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeColumn(index)}
                className="shrink-0 text-slate-400 hover:text-rose-600"
                aria-label="Usuń kolumnę"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="w-24">
        <label className={FIELD_LABEL}>Limit</label>
        <input
          type="number"
          min={1}
          max={20}
          className={TEXT_INPUT}
          value={config.limit}
          onChange={(e) => onChange({ limit: Number(e.target.value) || 1 })}
        />
      </div>
    </div>
  );
}

function KpiFields({
  config,
  processModels,
  onChange,
}: {
  config: KpiWidgetConfig;
  processModels: ProcessModelOption[];
  onChange: (patch: Partial<KpiWidgetConfig>) => void;
}) {
  const needsProcessFilter = config.metric === 'task-count' || config.metric === 'overdue-task-count' || config.metric === 'process-count';
  return (
    <div className="space-y-3">
      <div>
        <label className={FIELD_LABEL}>Metryka</label>
        <select
          className={TEXT_INPUT}
          value={config.metric}
          onChange={(e) => onChange({ metric: e.target.value as KpiMetric })}
        >
          {KPI_METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {needsProcessFilter && (
        <div>
          <label className={FIELD_LABEL}>Ogranicz do modeli procesów (puste = wszystkie)</label>
          <ProcessModelCheckboxes
            processModels={processModels}
            selected={config.processModelKeys ?? []}
            onChange={(keys) => onChange({ processModelKeys: keys.length ? keys : undefined })}
          />
        </div>
      )}
      <div>
        <label className={FIELD_LABEL}>Link po kliknięciu (opcjonalnie)</label>
        <input
          className={TEXT_INPUT}
          placeholder="/tasks"
          value={config.href ?? ''}
          onChange={(e) => onChange({ href: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

function ShortcutFields({
  config,
  onChange,
}: {
  config: ShortcutWidgetConfig;
  onChange: (patch: Partial<ShortcutWidgetConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={FIELD_LABEL}>Link</label>
        <input
          className={TEXT_INPUT}
          placeholder="/process-models"
          value={config.href}
          onChange={(e) => onChange({ href: e.target.value })}
        />
      </div>
      <div>
        <label className={FIELD_LABEL}>Opis (opcjonalnie)</label>
        <input
          className={TEXT_INPUT}
          value={config.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className={FIELD_LABEL}>Ikona (Iconify, opcjonalnie)</label>
        <input
          className={TEXT_INPUT}
          placeholder="mdi:link-variant"
          value={config.icon ?? ''}
          onChange={(e) => onChange({ icon: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

//  edycja źródła listy aplikacji powiązanych.
function RelatedAppsFields({
  config,
  onChange,
}: {
  config: RelatedAppsWidgetConfig;
  onChange: (patch: Partial<RelatedAppsWidgetConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        Linki są wczytywane z pliku JSON w formacie{' '}
        <code>{'{ "links": [{ "title", "url", "icon", "description" }] }'}</code> - żeby dodać lub
        usunąć aplikację, wystarczy zmienić ten plik.
      </p>
      <div>
        <label className={FIELD_LABEL}>Plik z listą (opcjonalnie)</label>
        <input
          className={TEXT_INPUT}
          placeholder={DEFAULT_RELATED_APPS_SOURCE}
          value={config.source ?? ''}
          onChange={(e) => onChange({ source: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}

function InvoiceQueueFields({
  config,
  onChange,
}: {
  config: InvoiceQueueWidgetConfig;
  onChange: (patch: Partial<InvoiceQueueWidgetConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        Pokazuje faktury zakupu z ERPNext czekające na akcję &quot;Zatwierdź&quot; - wymaga
        skonfigurowanej sekcji <code>[erpnext]</code> w galwork-hub.
      </p>
      <div className="w-24">
        <label className={FIELD_LABEL}>Limit</label>
        <input
          type="number"
          min={1}
          max={20}
          className={TEXT_INPUT}
          value={config.limit}
          onChange={(e) => onChange({ limit: Number(e.target.value) || 1 })}
        />
      </div>
    </div>
  );
}

function PaperlessQueueFields({
  config,
  onChange,
}: {
  config: PaperlessQueueWidgetConfig;
  onChange: (patch: Partial<PaperlessQueueWidgetConfig>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500">
        Pokazuje dokumenty z Paperless-ngx oznaczone wybranym tagiem (np. PDF-y faktur wgrane
        przez n8n z maila) - wymaga skonfigurowanej sekcji <code>[paperless]</code> w galwork-hub.
      </p>
      <div>
        <label className={FIELD_LABEL}>Tag w Paperless-ngx</label>
        <input
          className={TEXT_INPUT}
          placeholder="np. faktura-pdf-niepodlaczona"
          value={config.tag}
          onChange={(e) => onChange({ tag: e.target.value })}
        />
      </div>
      <div className="w-24">
        <label className={FIELD_LABEL}>Limit</label>
        <input
          type="number"
          min={1}
          max={20}
          className={TEXT_INPUT}
          value={config.limit}
          onChange={(e) => onChange({ limit: Number(e.target.value) || 1 })}
        />
      </div>
    </div>
  );
}

export default WidgetEditorDialog;
