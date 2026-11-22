// Widoczność „Dodaj akt” na podstawie uprawnienia z huba,
// a nie lokalnej roli `galwork-admin` (użytkownik może być w act_editor_groups).
import { useEffect, useState } from 'react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { permissionsApi } from '@/api/permissions';

export interface ActPermissionState {
  canCreateAct: boolean;
  loading: boolean;
}

// 2026-11-21: stan ładowania potrzebny pełnej stronie tworzenia aktu.
export function useCanCreateActState(): ActPermissionState {
  const auth = useAuth();
  const accessToken = auth?.authToken?.access_token ?? null;
  const [permission, setPermission] = useState<{ token: string; value: boolean } | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    permissionsApi
      .getMyPermissions()
      .then((permissions) => {
        if (active) setPermission({ token: accessToken, value: permissions.can_create_act });
      })
      .catch(() => {
        if (active) setPermission({ token: accessToken, value: false });
      });
    return () => {
      active = false;
    };
  }, [accessToken]);

  const loading = Boolean(accessToken) && permission?.token !== accessToken;
  return { canCreateAct: !loading && permission?.value === true, loading };
}

export function useCanCreateAct(): boolean {
  return useCanCreateActState().canCreateAct;
}

export default useCanCreateAct;
