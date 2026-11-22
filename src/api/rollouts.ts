// rejestr wdrożeń obiegów (GET /process-rollouts) i nazwy jednostek.
// `listAll` - cały rejestr (z opcjonalnymi filtrami), używany
// przez pulpit i stronę "Wdrożenia obiegów" sekcji Regulacje.
import { apiClient } from './client';
import { ProcessRolloutRead } from '@/types/rollouts';

interface Option {
  value: string;
  label: string;
}

export interface RolloutListParams {
  process_model_id?: string;
  /** Tylko wdrożenia obowiązujące w tym dniu (RRRR-MM-DD). */
  active_on?: string;
}

export const rolloutsApi = {
  /** Wdrożenia jednego obiegu (szczegóły modelu procesu). */
  async list(processModelId: string): Promise<ProcessRolloutRead[]> {
    const response = await apiClient.get<ProcessRolloutRead[]>('/process-rollouts', {
      params: { process_model_id: processModelId },
    });
    return response.data;
  },

  /**
   * Rejestr wdrożeń (wszystkie obiegi). Backend sortuje od najnowszej daty
   * obowiązywania; `active_on` ogranicza wynik do wdrożeń w mocy w tym dniu.
   */
  async listAll(params?: RolloutListParams): Promise<ProcessRolloutRead[]> {
    const response = await apiClient.get<ProcessRolloutRead[]>('/process-rollouts', {
      params,
    });
    return response.data;
  },

  /** id jednostki -> nazwa (opcje formularza "Wdrożenie obiegów"). */
  async orgUnitNames(): Promise<Record<string, string>> {
    const response = await apiClient.get<Option[]>('/process-rollouts/options/org-units', {
      params: { limit: 500 },
    });
    return Object.fromEntries(response.data.map((o) => [o.value, o.label]));
  },

  /** Numer i tytuł aktu (repozytorium regulacji); null - brak dostępu. */
  async actLabel(documentId: string): Promise<string | null> {
    try {
      const response = await apiClient.get<{ number: string | null; title: string }>(`/acts/${documentId}`);
      const { number, title } = response.data;
      return number ? `${number} - ${title}` : title;
    } catch {
      return null;
    }
  },
};
