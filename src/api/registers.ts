// rejestry sekcji (custom_dashboard2.md §4) - generyczne API
// huba: kolumny listy (metadata-fields), lista spraw z wyszukiwaniem,
// filtrami metadanych i sortowaniem (H2) oraz karta obiektu (H4).
import { apiClient } from './client';
import type { PageProcessInstanceRead, ProcessInstanceFilterParams } from '@/types/processInstances';
import type { MetadataField, ProcessInstanceRecordRead } from '@/types/sections';

/** Maksymalna strona przy eksporcie zestawienia do CSV. */
export const EXPORT_LIMIT = 1000;

export const registersApi = {
  /** Kolumny listy modelu z tytułem, typem, formatem i enum z formularzy. */
  async metadataFields(processModelKey: string): Promise<MetadataField[]> {
    const response = await apiClient.get<MetadataField[]>(
      `/process-models/${encodeURIComponent(processModelKey)}/metadata-fields`
    );
    return response.data;
  },

  /** Sprawy rejestru: `q`, `sort`, `status` i filtry `m.<klucz>`. */
  async list(params: ProcessInstanceFilterParams): Promise<PageProcessInstanceRead> {
    const response = await apiClient.get<PageProcessInstanceRead>('/process-instances', { params });
    return response.data;
  },

  /** Karta obiektu: formularz kroku karty tylko do odczytu, bieżące dane, edycja. */
  async record(instanceId: string): Promise<ProcessInstanceRecordRead> {
    const response = await apiClient.get<ProcessInstanceRecordRead>(
      `/process-instances/${encodeURIComponent(instanceId)}/record`
    );
    return response.data;
  },
};

export default registersApi;
