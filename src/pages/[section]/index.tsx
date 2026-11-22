/**
 * Pulpit sekcji (np. /it) - opis, kafelki rejestrów i słowników
 * z licznikami, zestawienia. Treść z konfiguracji src/configs/sections;
 * kolejna faza sekcji dopisuje kafelki bez zmian w tej stronie.
 */
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { TileCard } from '@/components/tiles/TileCard';
import { sectionPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findSection, registerPath } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';
import type { TileConfig } from '@/types/homeTiles';
import type { RegisterConfig, SectionConfig } from '@/types/sections';

const tileFor = (section: SectionConfig, register: RegisterConfig): TileConfig => ({
  id: register.slug,
  title: register.title,
  description: register.description,
  icon: register.icon,
  href: registerPath(section, register),
  count: { metric: 'process-count', processModelKeys: [register.model], status: register.defaultStatus ?? null },
});

const SectionPulpit = ({ section: slug }: SectionPageProps) => {
  const section = findSection(slug);
  if (!section) return null;

  return (
    <>
      <Head>
        <title>{section.title}</title>
      </Head>
      <div className="space-y-6">
        <section className="gw-frame p-5">
          <div className="flex items-start gap-3">
            <Icon icon={section.icon} className="h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{section.title}</h1>
              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">{section.description}</p>
              <p className="mt-2 text-[11px] text-slate-400">
                Wdrożone fazy: {section.phases.join(', ')}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Rejestry</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.registers.map((register) => (
              <TileCard key={register.slug} tile={tileFor(section, register)} />
            ))}
          </div>
        </section>

        {section.dictionaries.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Słowniki</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {section.dictionaries.map((dictionary) => (
                <TileCard key={dictionary.slug} tile={tileFor(section, dictionary)} />
              ))}
            </div>
          </section>
        )}

        {section.reports.length > 0 && (
          <section className="gw-frame p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Zestawienia</h2>
            <ul className="divide-y divide-slate-100">
              {section.reports.map((report) => (
                <li key={report.slug} className="py-2">
                  <Link
                    href={`/${section.slug}/zestawienia/${report.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <Icon icon="mdi:file-table-outline" className="h-4 w-4" />
                    {report.title}
                  </Link>
                  {report.description && <p className="ml-6 text-[11px] text-slate-500">{report.description}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
};

SectionPulpit.getLayout = sectionLayout;

export const getStaticPaths = sectionPaths;
export const getStaticProps = sectionProps;

export default SectionPulpit;
