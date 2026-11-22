// Ścieżki stron sekcji znane przy budowie (output: 'export') -
// z konfiguracji src/configs/sections. Identyfikator obiektu (karta) idzie w
// zapytaniu `?id=`, więc nie wymaga osobnej strony na obiekt.
import type { GetStaticPaths, GetStaticProps } from 'next';
import { SECTIONS, allRegisterParams, allReportParams } from '@/configs/sections';

export interface SectionPageProps {
  section: string;
  register?: string;
  report?: string;
}

export const sectionPaths: GetStaticPaths = async () => ({
  paths: SECTIONS.map((section) => ({ params: { section: section.slug } })),
  fallback: false,
});

export const registerPaths: GetStaticPaths = async () => ({
  paths: allRegisterParams().map((params) => ({ params })),
  fallback: false,
});

export const reportPaths: GetStaticPaths = async () => ({
  paths: allReportParams().map((params) => ({ params })),
  fallback: false,
});

export const sectionProps: GetStaticProps<SectionPageProps> = async ({ params }) => ({
  props: Object.fromEntries(
    Object.entries(params ?? {}).map(([key, value]) => [key, String(value)])
  ) as unknown as SectionPageProps,
});
