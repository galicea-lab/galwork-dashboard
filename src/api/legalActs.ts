// repozytorium aktów wewnętrznych (galwork-hub:
// wf/routers/legal_act_router.py). Lista służy do wyszukiwania aktu, a
// `getActState` zwraca status prawny na wybrany dzień (redakcje i relacje).
import { apiClient } from './client';
import type { ActState } from '@/types/documents';

/** `GET /acts` - opcje wyboru aktu (value = id dokumentu, label = numer i tytuł). */
export interface ActOption {
  value: string;
  label: string;
}

export interface ActListParams {
  q?: string;
  limit?: number;
}

export const legalActsApi = {
  async listActs(params?: ActListParams): Promise<ActOption[]> {
    const response = await apiClient.get<ActOption[]>('/acts', { params });
    return response.data;
  },

  /**
   * Status prawny aktu na dzień `on` (domyślnie dziś). `null` - dokument nie
   * jest aktem w repozytorium (backend zwraca 404).
   */
  async getActState(documentId: string, on?: string): Promise<ActState | null> {
    try {
      const response = await apiClient.get<ActState>(`/acts/${documentId}`, {
        params: on ? { on } : undefined,
      });
      return response.data;
    } catch (error) {
      if (!isNotFound(error)) throw error;
      return null;
    }
  },
};

/** axios 404 bez importu axios-a w każdym module wołającym. */
function isNotFound(error: unknown): boolean {
  const response = (error as { response?: { status?: number } })?.response;
  return response?.status === 404;
}

export default legalActsApi;
