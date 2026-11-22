/**
 * Layout stron sekcji (src/pages/[section]/**) - menu boczne
 * wyliczone z konfiguracji sekcji (src/configs/sections), jak SectionLayout
 * dla /regulations, ale bez ręcznej listy pozycji.
 */
import React, { ReactNode } from 'react';
import { findSection, sectionNavigation } from '@/configs/sections';
import { MAIN_NAVIGATION } from '@/configs/navigation';
import { SidebarLayout } from './SidebarLayout';

interface Props {
  section?: string;
  children: ReactNode;
}

export const RegisterSectionLayout = ({ section, children }: Props) => {
  const config = findSection(section);
  return (
    <SidebarLayout navigation={config ? sectionNavigation(config) : MAIN_NAVIGATION}>
      {children}
    </SidebarLayout>
  );
};

/** `Page.getLayout` dla stron sekcji - slug sekcji pochodzi z `getStaticProps`. */
export const sectionLayout = (page: React.ReactElement) => (
  <RegisterSectionLayout section={(page.props as { section?: string }).section}>{page}</RegisterSectionLayout>
);

export default RegisterSectionLayout;
