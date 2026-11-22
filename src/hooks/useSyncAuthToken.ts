/**
 * Jedno miejsce synchronizacji tokenu sesji z klientem API.
 *
 * `AuthProvider` (biblioteka nextjs-keycloak-auth) trzyma token w kontekście
 * React; `src/api/client.ts` dokleja go jako `Authorization: Bearer ...` do
 * każdego żądania. Ten hook przepisuje aktualny access_token do klienta API
 * natychmiast po zmianie (logowanie, odświeżenie, wylogowanie) i jest
 * używany przez wszystkie layouty - dzięki temu strona startowa (bez paska
 * bocznego) i podstrony zachowują się identycznie.
 */
import { useRef } from 'react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { setAuthToken } from '@/api/client';

export function useSyncAuthToken(): string | null {
  const auth = useAuth();
  const accessToken = auth?.authToken?.access_token ?? null;
  const lastSyncedRef = useRef<string | null>(null);

  if (lastSyncedRef.current !== accessToken) {
    lastSyncedRef.current = accessToken;
    setAuthToken(accessToken);
  }

  return accessToken;
}

export default useSyncAuthToken;
