/**
 * Layout sekcji "Regulacje i wdrożenia" (/regulations/*).
 *
 * Sekcja ma własne menu boczne (REGULATIONS_NAVIGATION), inne niż główny
 * dashboard - zgodnie z założeniem, że "dopiero na podstronach pojawia się
 * boczne menu", a każda sekcja pokazuje swoje pozycje.
 */
import React, { ReactNode } from 'react';
import { REGULATIONS_NAVIGATION } from '@/configs/navigation';
import { SidebarLayout } from './SidebarLayout';

interface Props {
  children: ReactNode;
}

export const SectionLayout = ({ children }: Props) => {
  return <SidebarLayout navigation={REGULATIONS_NAVIGATION}>{children}</SidebarLayout>;
};

export default SectionLayout;
