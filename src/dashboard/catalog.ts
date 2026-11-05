import type {
  InvoiceQueueWidgetConfig,
  KpiWidgetConfig,
  PaperlessQueueWidgetConfig,
  RelatedAppsWidgetConfig,
  ProcessListWidgetConfig,
  ShortcutWidgetConfig,
  TaskQueueWidgetConfig,
  WidgetConfig,
  WidgetType,
} from '@/types/dashboardConfig';
import { createWidgetId } from './storage';

export interface WidgetCatalogEntry {
  type: WidgetType;
  label: string;
  icon: string;
  description: string;
  createDefault: () => WidgetConfig;
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  {
    type: 'task-queue',
    label: 'Kolejka zadań',
    icon: 'mdi:format-list-checks',
    description:
      'Lista Twoich zadań, opcjonalnie ograniczona do wybranych procesów (np. "Korespondencja do przejrzenia").',
    createDefault: (): TaskQueueWidgetConfig => ({
      id: createWidgetId(),
      type: 'task-queue',
      title: 'Moje zadania',
      icon: 'mdi:format-list-checks',
      size: 'md',
      limit: 5,
    }),
  },
  {
    type: 'process-list',
    label: 'Lista instancji procesu',
    icon: 'mdi:file-tree-outline',
    description:
      'Lista instancji wybranego procesu z kolumnami zmapowanymi na pola z danych procesu (np. kwota, nadawca, nr sprawy).',
    createDefault: (): ProcessListWidgetConfig => ({
      id: createWidgetId(),
      type: 'process-list',
      title: 'Instancje procesu',
      icon: 'mdi:file-tree-outline',
      size: 'lg',
      columns: [],
      limit: 5,
    }),
  },
  {
    type: 'kpi',
    label: 'Kafelek-licznik',
    icon: 'mdi:counter',
    description: 'Mała liczba do szybkiego przeglądu, np. liczba przeterminowanych zadań.',
    createDefault: (): KpiWidgetConfig => ({
      id: createWidgetId(),
      type: 'kpi',
      title: 'Licznik',
      icon: 'mdi:counter',
      size: 'sm',
      metric: 'task-count',
    }),
  },
  {
    type: 'shortcut',
    label: 'Skrót',
    icon: 'mdi:link-variant',
    description: 'Kafelek-przycisk prowadzący do konkretnej strony lub akcji.',
    createDefault: (): ShortcutWidgetConfig => ({
      id: createWidgetId(),
      type: 'shortcut',
      title: 'Skrót',
      icon: 'mdi:link-variant',
      size: 'sm',
      href: '/tasks',
    }),
  },
  {
    type: 'invoice-queue',
    label: 'Faktury do zatwierdzenia',
    icon: 'mdi:receipt-text-check-outline',
    description:
      'Faktury zakupu z ERPNext czekające na akcję "Zatwierdź" - wymaga skonfigurowanej sekcji [erpnext] w galwork-hub.',
    createDefault: (): InvoiceQueueWidgetConfig => ({
      id: createWidgetId(),
      type: 'invoice-queue',
      title: 'Faktury do zatwierdzenia',
      icon: 'mdi:receipt-text-check-outline',
      size: 'md',
      limit: 5,
    }),
  },
  {
    type: 'paperless-queue',
    label: 'Dokumenty z Paperless',
    icon: 'mdi:file-pdf-box',
    description:
      'Dokumenty z Paperless-ngx oznaczone wybranym tagiem (np. PDF-y faktur wgrane przez n8n z maila) - wymaga skonfigurowanej sekcji [paperless] w galwork-hub.',
    createDefault: (): PaperlessQueueWidgetConfig => ({
      id: createWidgetId(),
      type: 'paperless-queue',
      title: 'Dokumenty z Paperless',
      icon: 'mdi:file-pdf-box',
      size: 'md',
      tag: '',
      limit: 5,
    }),
  },

  {
    type: 'related-apps',
    label: 'Aplikacje powiązane',
    icon: 'mdi:apps',
    description: 'Spis linków do powiązanych aplikacji, wczytywany z pliku JSON (domyślnie /related-apps.json).',
    createDefault: (): RelatedAppsWidgetConfig => ({
      id: createWidgetId(),
      type: 'related-apps',
      title: 'Aplikacje powiązane',
      icon: 'mdi:apps',
      size: 'sm',
    }),
  },
];

export function getCatalogEntry(type: WidgetType): WidgetCatalogEntry {
  const entry = WIDGET_CATALOG.find((e) => e.type === type);
  if (!entry) {
    throw new Error(`Nieznany typ widgetu: ${type}`);
  }
  return entry;
}
