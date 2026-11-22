// uprawnienia WF zwracane przez GET /v1/wf/me/permissions.
// Dashboard nie powtarza konfiguracji grup - korzysta z decyzji huba.
import { apiClient } from './client';

export interface WfPermissions {
  can_create_act: boolean;
}

export const permissionsApi = {
  async getMyPermissions(): Promise<WfPermissions> {
    const { data } = await apiClient.get<WfPermissions>('/me/permissions');
    return data;
  },
};

export default permissionsApi;
