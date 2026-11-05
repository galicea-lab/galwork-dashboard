import { apiClient } from './client';
import type { DictionaryOption } from '@galicea-lab/rjsf-widgets';

/**
 * Słowniki wyboru dla pól `AsyncSelectWidget`/`TreeSelectWidget`
 * (@galicea-lab/rjsf-widgets) - funkcja `listOptions` poniżej jest
 * przekazywana jako `fetchOptions` do `DictionaryProvider` w `_app.tsx`.
 *
 * `endpoint` w `ui:options` jest ścieżką ABSOLUTNĄ od korzenia API huba, 
 *  np.`/v1/wf/users`
 *
 */

const WF_PREFIX = /^\/v1\/wf(\/|$)/;

function toApiPath(endpoint: string): string {
  return endpoint.replace(WF_PREFIX, '/');
}

export const dictionariesApi = {
  /**
   * Opcje dla jednego pola `AsyncSelectWidget` - `endpoint` pochodzi z
   * `ui:options.endpoint` tego pola w uiSchema.
   */
  async listOptions(endpoint: string, q?: string): Promise<DictionaryOption[]> {
    const response = await apiClient.get<DictionaryOption[]>(toApiPath(endpoint), {
      params: q ? { q } : undefined,
    });
    return response.data;
  },
};
