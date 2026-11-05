/**
 * Dokumenty z Paperless-ngx filtrowane po tagu - zob. galwork-hub:
 * wf/schemas/wf_schemas.py (PaperlessDocumentSummary) i
 * wf/services/paperless_document_service.py.
 */

export interface PaperlessDocumentSummary {
  id: number;
  title: string;
  created?: string | null;
  original_file_name?: string | null;
  /** Pełny link do dokumentu w Paperless-ngx. */
  url: string;
}

export interface PaperlessDocumentPage {
  items: PaperlessDocumentSummary[];
  total: number;
}
