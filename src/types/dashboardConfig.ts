/**
 * Konfiguracja pulpitu głównego (dashboard) - zestaw widgetów wybrany przez
 * użytkownika, renderowanych na podstawie danych z /v1/wf (zadania, instancje
 * procesów), bez żadnych nowych endpointów backendu.
 *
 * Układ jest dziś przechowywany w localStorage (zob. src/dashboard/storage.ts)
 * - stąd `DashboardLayout.version`, żeby bezpiecznie zmieniać kształt w
 * przyszłości (także przy ewentualnym przeniesieniu na backend per-user).
 */

import type { ProcessInstanceStatus } from './processInstances';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export type WidgetType =
  | 'task-queue'
  | 'process-list'
  | 'kpi'
  | 'shortcut'
  | 'invoice-queue'
  | 'paperless-queue'
  | 'related-apps';

interface WidgetConfigBase {
  /** Stabilny identyfikator instancji widgetu na pulpicie (nie typu widgetu). */
  id: string;
  type: WidgetType;
  title: string;
  /** Nazwa ikony Iconify, np. "mdi:email-outline". */
  icon?: string;
  size: WidgetSize;
}

export interface TaskQueueWidgetConfig extends WidgetConfigBase {
  type: 'task-queue';
  /** Puste/undefined = wszystkie modele procesów. */
  processModelKeys?: string[];
  onlyClaimed?: boolean;
  overdueOnly?: boolean;
  limit: number;
}

export interface ProcessListColumn {
  label: string;
  /** Ścieżka do pola we `ProcessInstanceRead.summary`, np. "kwota" albo "nadawca.nazwa". */
  path: string;
}

export interface ProcessListWidgetConfig extends WidgetConfigBase {
  type: 'process-list';
  processModelKeys?: string[];
  status?: ProcessInstanceStatus | null;
  columns: ProcessListColumn[];
  limit: number;
}

export type KpiMetric = 'task-count' | 'overdue-task-count' | 'process-count' | 'notification-count';

export interface KpiWidgetConfig extends WidgetConfigBase {
  type: 'kpi';
  metric: KpiMetric;
  /** Dla metric = 'task-count'/'overdue-task-count'/'process-count'. */
  processModelKeys?: string[];
  status?: ProcessInstanceStatus | null;
  /** Strona, na którą przechodzi kliknięcie kafelka. */
  href?: string;
}

export interface ShortcutWidgetConfig extends WidgetConfigBase {
  type: 'shortcut';
  href: string;
  description?: string;
}

/**
 * Faktury zakupu z ERPNext czekające na "Zatwierdź" (zob. galwork-hub:
 * wf/services/erpnext_invoice_service.py). W przeciwieństwie do
 * `task-queue`/`process-list` nie filtruje po `processModelKeys` - to nie
 * dane SpiffWorkflow, tylko odpytanie ERPNext na żywo.
 */
export interface InvoiceQueueWidgetConfig extends WidgetConfigBase {
  type: 'invoice-queue';
  limit: number;
}

/**
 * Dokumenty z Paperless-ngx oznaczone wybranym tagiem (zob. galwork-hub:
 * wf/services/paperless_document_service.py) - np. PDF-y faktur wgrane
 * przez n8n z maila (KSeF daje tylko XML). `tag` jest tym samym, co n8n
 * ustawia przy uploadzie do Paperless - czysto odczytowy widget, bez
 * żadnego dopasowywania do konkretnej faktury (to zostaje manualne).
 */
export interface PaperlessQueueWidgetConfig extends WidgetConfigBase {
  type: 'paperless-queue';
  tag: string;
  limit: number;
}

// spis linków do aplikacji powiązanych. Lista nie jest
// zapisywana w układzie pulpitu, tylko czytana z pliku JSON (`source`),
// żeby dodawanie/usuwanie linków nie wymagało zmian w kodzie ani w
// zapisanych układach użytkowników. Format pliku: `{ "links": RelatedAppLink[] }`.
export const DEFAULT_RELATED_APPS_SOURCE = '/related-apps.json';

export interface RelatedAppLink {
  title: string;
  /** Adres absolutny (otwierany w nowej karcie) albo ścieżka w dashboardzie ("/tasks"). */
  url: string;
  icon?: string;
  description?: string;
}

export interface RelatedAppsWidgetConfig extends WidgetConfigBase {
  type: 'related-apps';
  /** Puste/undefined = DEFAULT_RELATED_APPS_SOURCE. */
  source?: string;
}

export type WidgetConfig =
  | TaskQueueWidgetConfig
  | ProcessListWidgetConfig
  | KpiWidgetConfig
  | ShortcutWidgetConfig
  | InvoiceQueueWidgetConfig
  | PaperlessQueueWidgetConfig
  | RelatedAppsWidgetConfig;

export interface DashboardLayout {
  version: 1;
  widgets: WidgetConfig[];
}
