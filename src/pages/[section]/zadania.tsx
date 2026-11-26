/**
 * Moje zadania w sekcji (np. /it/zadania) - skrzynka zadań
 * (`GET /tasks/my`) zawężona do modeli rejestrów i słowników sekcji.
 * Hub nie filtruje skrzynki po modelu, więc filtr jest po stronie klienta
 * na większej stronie (jak liczniki w src/api/metrics.ts).
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { extractApiError } from '@/api/client';
import { tasksApi } from '@/api/tasks';
import { LoadingSpinner } from '@/components/common';
import { formatDateTime } from '@/components/registers/format';
import { sectionPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findSection, sectionModelKeys } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';
import type { MyTaskItem } from '@/types/tasks';

const FETCH_LIMIT = 200;

interface Loaded {
  items: MyTaskItem[];
  error: string | null;
}

const SectionTasksPage = ({ section: slug }: SectionPageProps) => {
  const section = findSection(slug);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!section) return undefined;
    let cancelled = false;
    const keys = sectionModelKeys(section);
    // 2026-11-25: filtr obiegów sekcji po stronie huba
    tasksApi
      .listMyTasks({ limit: FETCH_LIMIT, process_model_keys: keys })
      .then((page) => {
        if (!cancelled) setLoaded({ items: page.items, error: null });
      })
      .catch((err: unknown) => !cancelled && setLoaded({ items: [], error: extractApiError(err) }));
    return () => {
      cancelled = true;
    };
  }, [section]);

  if (!section) return null;

  return (
    <>
      <Head>
        <title>{`Moje zadania | ${section.title}`}</title>
      </Head>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Moje zadania w sekcji {section.title}</h1>
        {!loaded ? (
          <LoadingSpinner message="Wczytywanie zadań..." />
        ) : loaded.error ? (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {loaded.error}
          </div>
        ) : loaded.items.length === 0 ? (
          <div className="gw-frame px-4 py-10 text-center text-xs text-slate-500">Brak zadań w tej sekcji.</div>
        ) : (
          <ul className="gw-frame divide-y divide-slate-100">
            {loaded.items.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/tasks/${task.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    {task.name}
                  </Link>
                  <p className="text-[11px] text-slate-500">
                    {task.process_title} · {task.process_model_name}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  {task.due_at && (
                    <span className="inline-flex items-center gap-1">
                      <Icon icon="mdi:clock-outline" className="h-3.5 w-3.5" />
                      {formatDateTime(task.due_at)}
                    </span>
                  )}
                  <span>{task.claimed_by_me ? 'podjęte przez Ciebie' : 'do podjęcia'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

SectionTasksPage.getLayout = sectionLayout;

export const getStaticPaths = sectionPaths;
export const getStaticProps = sectionProps;

export default SectionTasksPage;
