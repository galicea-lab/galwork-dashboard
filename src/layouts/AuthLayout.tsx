/**
 * Layout ekranu logowania - bez paska bocznego.
 *
 * Logowanie nie jest podstroną dashboardu, więc nie pokazuje menu bocznego:
 * jest tylko znaczek systemu w nagłówku, wyśrodkowana karta logowania
 * (LoginPage z biblioteki) i stopka. Karta jest neutralizowana w
 * src/styles/custom.css (`.gw-auth > div`), żeby nie rozciągała się na cały
 * ekran i nie wnosiła własnego tła.
 */
import React, { ReactNode } from 'react';
import { useSyncAuthToken } from '@/hooks/useSyncAuthToken';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

interface Props {
  children: ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  useSyncAuthToken();

  return (
    <div className="gw-page flex min-h-screen flex-col">
      <AppHeader showBrand tone="brand" />
      <main className="gw-auth flex flex-1 items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};

export default AuthLayout;
