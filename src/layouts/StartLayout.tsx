/**
 * Layout strony głównej (publiczny adres "/") - bez paska bocznego.
 *
 * Strona główna ma tylko nagłówek, treść i stopkę; menu boczne pojawia się
 * dopiero na podstronach (SidebarLayout). Nagłówek w wariancie `brand` -
 * ciemny pasek w stylu strony galwork-www (src/styles/custom.css).
 */
import React, { ReactNode } from 'react';
import { useSyncAuthToken } from '@/hooks/useSyncAuthToken';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

interface Props {
  children: ReactNode;
}

export const StartLayout = ({ children }: Props) => {
  useSyncAuthToken();

  return (
    <div className="gw-page flex min-h-screen flex-col">
      <AppHeader showBrand tone="brand" />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
};

export default StartLayout;
