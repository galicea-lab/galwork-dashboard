// dyskusje o sprawie - linki do wątków w komunikatorze (bez integracji zwrotnej).
import { apiClient } from './client';
import { DiscussionList, DiscussionRead } from '@/types/discussions';

export const discussionsApi = {
  async list(instanceId: string): Promise<DiscussionList> {
    const response = await apiClient.get<DiscussionList>(`/process-instances/${instanceId}/discussions`);
    return response.data;
  },

  async add(instanceId: string, url: string, title?: string): Promise<DiscussionRead> {
    const response = await apiClient.post<DiscussionRead>(`/process-instances/${instanceId}/discussions`, {
      url,
      title: title || undefined,
    });
    return response.data;
  },
};
