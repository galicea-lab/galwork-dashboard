/**
 * Sekcje dashboardu = scenariusze wdrożeniowe wdrażane fazami
 * (galwork-models-book, „Scenariusze wdrożeniowe”; przepis ekranów:
 * galwork-dev-jw/wdrozenia/galicea/custom_dashboard2.md).
 *
 * Sekcja to jedna podstrona z własnym menu. Kolejna faza dopisuje rejestr,
 * słownik albo zestawienie do konfiguracji – strony są wspólne
 * (src/pages/[section]/**) i nie znają nazw pól modeli.
 */
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import type { ProcessInstanceStatus } from './processInstances';
import type { PrintOption } from './prints';

/** Rejestr sekcji: obiekt = instancja modelu BPMN (`process_model_key`). */
export interface RegisterConfig {
  /** Segment adresu: /<sekcja>/<slug>/ (nie „zadania” ani „zestawienia”). */
  slug: string;
  /** Klucz modelu procesu w galwork-hub. */
  model: string;
  title: string;
  icon?: string;
  description?: string;
  /** Tekst przycisku dodawania; brak `canCreate: false` = „Nowy wpis”. */
  newLabel?: string;
  canCreate?: boolean;
  /** Ścieżka w danych formularza startowego użyta jako tytuł sprawy. */
  titleField?: string;
  /** Domyślny filtr statusu listy (np. `running` = wpisy aktywne). */
  defaultStatus?: ProcessInstanceStatus | null;
  /** Kolumny listy (klucze metadanych); brak = wszystkie z modelu. */
  columns?: string[];
  /** Faza, która wprowadziła rejestr (np. „IT.1”). */
  phase?: string;
}

/** Zestawienie = zapisany widok listy rejestru. */
export interface ReportConfig {
  slug: string;
  title: string;
  description?: string;
  /** `slug` rejestru albo słownika tej sekcji. */
  register: string;
  /** Równość wartości metadanych (`m.<klucz>=wartość`). */
  filter?: Record<string, string>;
  /** Sortowanie listy, np. `m.data_wygasniecia` albo `-started_at`. */
  sort?: string;
  status?: ProcessInstanceStatus | null;
  columns?: string[];
  phase?: string;
}

export interface SectionConfig {
  slug: string;
  /** Kod sekcji w katalogu scenariuszy (IT, RODO, FIN, …). */
  code: string;
  title: string;
  icon: string;
  description: string;
  /** 2026-11-22: krótki opis na kafelku strony głównej („Twoje obszary pracy”). */
  summary?: string;
  /** Wdrożone fazy sekcji (np. ['IT.1']). */
  phases: string[];
  registers: RegisterConfig[];
  /** Słowniki prowadzone jako rejestry (lista i karta jak w rejestrze). */
  dictionaries: RegisterConfig[];
  reports: ReportConfig[];
}

/** `GET /v1/wf/process-models/{key}/metadata-fields` (galwork-hub). */
export interface MetadataField {
  key: string;
  path: string;
  title: string;
  type?: string | string[];
  format?: string;
  enum?: unknown[];
}

/** `GET /v1/wf/process-instances/{id}/record` (galwork-hub, H4). */
export interface ProcessInstanceRecordRead {
  instance_id: string;
  process_model_key?: string | null;
  title: string;
  status: ProcessInstanceStatus;
  record_step?: string | null;
  has_form: boolean;
  json_schema: RJSFSchema;
  ui_schema: UiSchema;
  form_data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  edit_task_id?: string | null;
  edit_task_name?: string | null;
  prints: PrintOption[];
}
