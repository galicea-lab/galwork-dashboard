/**
 * Dokumenty sprawy (instancji procesu) - kontrakt z galwork-hub
 * `GET/POST /process-instances/{id}/documents` (wf/routers/instance_document_router.py,
 * schematy DocumentRead / DocumentDetail / ProcessInstanceDocumentRead).
 */
import { UserSummary } from './common';

export type DocumentLinkRole = 'main' | 'attachment' | 'related';

export type IngestStatus = 'staged' | 'submitted' | 'done' | 'failed' | 'duplicate';

export interface DocumentVersionRead {
  id: string;
  document_id: string;
  version_no: number;
  label: string | null;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  /** skrót treści z chwili wgrania - weryfikowany przy pobraniu */
  sha256: string;
  ingest_status: IngestStatus;
  ingest_error: string | null;
  ingested_at: string | null;
  paperless_version_id: number | null;
  uploaded_by: UserSummary;
  uploaded_at: string;
  human_task_id: string | null;
  /** 2026-11-17: data wejścia w życie redakcji aktu */
  effective_from?: string | null;
}

export interface DocumentRead {
  id: string;
  doc_type: string;
  registry_number: string | null;
  title: string;
  status: string;
  metadata: Record<string, unknown>;
  paperless_document_id: number | null;
  current_version_no: number | null;
  created_by: UserSummary;
  created_at: string;
  current_version: DocumentVersionRead | null;
}

export interface DocumentDetail extends DocumentRead {
  versions: DocumentVersionRead[];
  process_instance_ids: string[];
}

export interface InstanceDocumentRead {
  document: DocumentRead;
  role: DocumentLinkRole;
  added_at: string;
}

export interface DocumentUpload {
  file: File;
  title?: string;
  role?: DocumentLinkRole;
  /** nowa wersja istniejącego dokumentu sprawy */
  documentId?: string;
  taskId?: string;
  label?: string;
}

/** 2026-11-17: akt wewnętrzny - status prawny na dzień (`GET /acts/{id}?on=`). */
export interface ActRelation {
  document_id: string;
  title: string;
  number: string | null;
  relation_type: 'amends' | 'repeals';
  effective_from: string;
  target_version_no: number | null;
}

export interface ActVersion {
  version_no: number;
  effective_from: string | null;
  valid_to: string | null;
  file_name: string;
  sha256: string;
  label: string | null;
  sealed: boolean;
}

export interface ActState {
  document_id: string;
  title: string;
  number: string | null;
  on: string;
  /** kody jak w polu "Status" formularzy regulacji */
  status_code: string;
  status: string;
  status_manual: boolean;
  valid_version_no: number | null;
  valid_from: string | null;
  valid_to: string | null;
  repository_instance_id: string | null;
  versions: ActVersion[];
  amended_by: ActRelation[];
  repealed_by: ActRelation | null;
  amends: ActRelation[];
  repeals: ActRelation[];
}
