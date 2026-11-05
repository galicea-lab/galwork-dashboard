import { apiClient } from './client';
import type { PaperlessDocumentPage } from '@/types/paperlessDocuments';

export const paperlessDocumentsApi = {
  /**
   * Dokumenty z Paperless-ngx oznaczone tagiem `tag` (np. PDF-y faktur
   * wgrane przez n8n z maila) - `/v1/wf/paperless/...` zwraca 503, gdy
   * sekcja `[paperless]` w config/config.ini (galwork-hub) nie jest
   * skonfigurowana.
   */
  async listByTag(tag: string, limit = 10): Promise<PaperlessDocumentPage> {
    const response = await apiClient.get<PaperlessDocumentPage>('/paperless/documents', {
      params: { tag, limit },
    });
    return response.data;
  },
};
