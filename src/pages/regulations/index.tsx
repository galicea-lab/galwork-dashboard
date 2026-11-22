/**
 * PULPIT SEKCJI "Regulacje i wdrożenia" (/regulations).
 *
 * Odpowiednik pulpitu głównego (/home), ale dla obszaru regulacji: kafelki
 * kategorii z licznikami (konfiguracja w src/configs/regulations.ts) oraz
 * skrócone listy najnowszych wdrożeń obiegów i ostatnich spraw z dokumentami.
 * Menu boczne sekcji pochodzi z REGULATIONS_NAVIGATION (SectionLayout).
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import { Icon } from '@iconify/react';
import { REGULATIONS_INTRO, REGULATIONS_TILES } from '@/configs/regulations';
import { TileCard } from '@/components/tiles/TileCard';
import SectionLayout from '@/layouts/SectionLayout';
import { Badge, BadgeVariant, LoadingSpinner } from '@/components/common';
import { ProcessInstanceStatusBadge } from '@/components/process-instances/ProcessInstanceStatusBadge';
import { rolloutsApi } from '@/api/rollouts';
import { processModelsApi } from '@/api/processModels';
import { processInstancesApi } from '@/api/processInstances';
import { extractApiError } from '@/api/client';
import type { ProcessRolloutRead, UsageMode } from '@/types/rollouts';
import { USAGE_MODE_LABELS } from '@/types/rollouts';
import type { ProcessInstanceRead } from '@/types/processInstances';

const LATEST_ROLLOUTS_LIMIT = 5;
const LATEST_INSTANCES_LIMIT = 5;

const MODE_VARIANT: Record<UsageMode, BadgeVariant> = {
  test: 'danger',
  auxiliary: 'warning',
  production: 'success',
};

interface Overview {
  rollouts: ProcessRolloutRead[];
  modelNames: Record<string, string>;
  instances: ProcessInstanceRead[];
}

interface OverviewState {
  data: Overview | null;
  error: string | null;
}

const EMPTY_OVERVIEW: Overview = { rollouts: [], modelNames: {}, instances: [] };

const RegulationsPulpit: NextPage = () => {
  // `loaded` trzyma wynik jednego odczytu; brak wyniku = stan wczytywania
  // (bez setState w ciele efektu - zob. src/components/tiles/TileCard.tsx).
  const [loaded, setLoaded] = useState<OverviewState | null>(null);
  const loading = loaded === null;
  const error = loaded?.error ?? null;
  const overview = loaded?.data ?? EMPTY_OVERVIEW;

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      rolloutsApi.listAll(),
      processModelsApi.listProcessModels({ active_only: false }),
      processInstancesApi.listProcessInstances({ limit: LATEST_INSTANCES_LIMIT }),
    ])
      .then(([rollouts, models, instancesPage]) => {
        if (cancelled) return;
        setLoaded({
          error: null,
          data: {
            rollouts: rollouts.slice(0, LATEST_ROLLOUTS_LIMIT),
            modelNames: Object.fromEntries(models.map((model) => [model.id, model.name])),
            instances: instancesPage.items,
          },
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoaded({ data: null, error: extractApiError(err) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Regulacje i wdrożenia | Pulpit</title>
      </Head>

      <div className="space-y-6">
        {/* Opis sekcji - tekst na całą szerokość karty (bez zawężania do
            połowy ekranu: 2026-11-18) */}
        <section className="gw-card p-6">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {REGULATIONS_INTRO.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{REGULATIONS_INTRO.lead}</p>
          {REGULATIONS_INTRO.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-2 text-xs text-slate-500">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Kafelki kategorii */}
        <section>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {REGULATIONS_INTRO.tilesTitle}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REGULATIONS_TILES.map((tile) => (
              <TileCard key={tile.id} tile={tile} />
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </p>
        )}

        {loading ? (
          <LoadingSpinner message="Wczytywanie rejestru regulacji..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Najnowsze wdrożenia obiegów */}
            <section className="gw-frame p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {REGULATIONS_INTRO.latestRolloutsTitle}
                </h2>
                <Link
                  href="/regulations/rollouts"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Zobacz rejestr <Icon icon="mdi:arrow-right" className="h-3 w-3" />
                </Link>
              </div>

              {overview.rollouts.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">Brak zarejestrowanych wdrożeń.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {overview.rollouts.map((rollout) => (
                    <li key={rollout.id}>
                      <Link
                        href="/regulations/rollouts"
                        className="-mx-1 flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-800">
                            {overview.modelNames[rollout.process_model_id] ?? 'Obieg'}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            od {rollout.valid_from}
                            {rollout.valid_to ? ` do ${rollout.valid_to}` : ''} · akt wersja{' '}
                            {rollout.act_version_no}
                          </p>
                        </div>
                        <Badge variant={MODE_VARIANT[rollout.mode] ?? 'default'} size="sm">
                          {USAGE_MODE_LABELS[rollout.mode] ?? rollout.mode}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Ostatnie sprawy */}
            <section className="gw-frame p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-900">
                  {REGULATIONS_INTRO.latestInstancesTitle}
                </h2>
                <Link
                  href="/process-instances"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Zobacz wszystkie <Icon icon="mdi:arrow-right" className="h-3 w-3" />
                </Link>
              </div>

              {overview.instances.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">Brak spraw w rejestrze instancji.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {overview.instances.map((instance) => (
                    <li key={instance.id}>
                      <Link
                        href={`/process-instances/${instance.id}`}
                        className="-mx-1 flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-800">
                            {instance.title}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {instance.process_model_name ?? instance.process_model_key ?? 'Obieg'}
                          </p>
                        </div>
                        <ProcessInstanceStatusBadge status={instance.status} size="sm" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
};

RegulationsPulpit.getLayout = (page: React.ReactElement) => <SectionLayout>{page}</SectionLayout>;

export default RegulationsPulpit;
