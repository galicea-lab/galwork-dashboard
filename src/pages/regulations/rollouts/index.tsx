/**
 * WDROŻENIA OBIEGÓW - rejestr wdrożeń w jednostkach.
 *
 * Źródło danych: `GET /process-rollouts` (galwork-hub: wf/routers/rollout_router.py)
 * z opcjonalnym `active_on=RRRR-MM-DD`. Nazwy obiegów pochodzą z listy modeli
 * procesów, nazwy jednostek z `/process-rollouts/options/org-units`, a numer i
 * tytuł aktu z repozytorium regulacji (`GET /acts/{id}`). Wdrożenia powstają
 * wyłącznie z aktu - ten ekran niczego nie zapisuje.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import { Icon } from '@iconify/react';
import { rolloutsApi } from '@/api/rollouts';
import { processModelsApi } from '@/api/processModels';
import { extractApiError } from '@/api/client';
import { Badge, BadgeVariant, EmptyState, LoadingSpinner } from '@/components/common';
import { USAGE_MODE_LABELS } from '@/types/rollouts';
import type { ProcessRolloutRead, UsageMode } from '@/types/rollouts';
import SectionLayout from '@/layouts/SectionLayout';

const MODE_VARIANT: Record<UsageMode, BadgeVariant> = {
  test: 'danger',
  auxiliary: 'warning',
  production: 'success',
};

const today = () => new Date().toISOString().slice(0, 10);

interface RegisterData {
  rollouts: ProcessRolloutRead[];
  modelNames: Record<string, string>;
  unitNames: Record<string, string>;
  actLabels: Record<string, string | null>;
}

const EMPTY_DATA: RegisterData = {
  rollouts: [],
  modelNames: {},
  unitNames: {},
  actLabels: {},
};

interface RegisterState {
  key: boolean;
  data: RegisterData | null;
  error: string | null;
}

const RolloutsPage: NextPage = () => {
  const [onlyActive, setOnlyActive] = useState(true);

  // Stan trzyma klucz filtra (`onlyActive`), więc zmiana filtra sama wraca do
  // stanu "wczytywanie" - bez setState w ciele efektu.
  const [loaded, setLoaded] = useState<RegisterState | null>(null);
  const current = loaded?.key === onlyActive ? loaded : null;
  const loading = current === null;
  const error = current?.error ?? null;
  const data = current?.data ?? EMPTY_DATA;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [rollouts, models, unitNames] = await Promise.all([
        rolloutsApi.listAll(onlyActive ? { active_on: today() } : undefined),
        processModelsApi.listProcessModels({ active_only: false }),
        rolloutsApi.orgUnitNames().catch(() => ({}) as Record<string, string>),
      ]);

      // Etykiety aktów - jeden odczyt na unikalny identyfikator dokumentu.
      const actIds = Array.from(new Set(rollouts.map((r) => r.act_document_id)));
      const labels = await Promise.all(actIds.map((id) => rolloutsApi.actLabel(id)));

      if (cancelled) return;
      setLoaded({
        key: onlyActive,
        error: null,
        data: {
          rollouts,
          modelNames: Object.fromEntries(models.map((m) => [m.id, m.name])),
          unitNames,
          actLabels: Object.fromEntries(actIds.map((id, i) => [id, labels[i]])),
        },
      });
    })().catch((err: unknown) => {
      if (!cancelled) setLoaded({ key: onlyActive, data: null, error: extractApiError(err) });
    });

    return () => {
      cancelled = true;
    };
  }, [onlyActive]);

  const rows = useMemo(
    () =>
      data.rollouts.map((rollout) => ({
        rollout,
        modelName: data.modelNames[rollout.process_model_id] ?? 'Obieg',
        units:
          rollout.org_unit_ids.length === 0
            ? 'cała organizacja'
            : rollout.org_unit_ids.map((id) => data.unitNames[id] ?? id).join(', '),
        actLabel: data.actLabels[rollout.act_document_id] ?? rollout.act_document_id,
        closed: rollout.closed_at !== null,
      })),
    [data]
  );

  return (
    <>
      <Head>
        <title>Wdrożenia obiegów | Regulacje i wdrożenia</title>
      </Head>

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Wdrożenia obiegów</h1>
            <p className="mt-1 text-xs text-slate-500">
              Tryb użycia obiegu (testowy / pomocniczy / produkcyjny), jednostki organizacyjne,
              okres obowiązywania i akt, na podstawie którego obieg jest używany.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(event) => setOnlyActive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Tylko obowiązujące dziś
            </label>
            <span className="text-[11px] text-slate-500">
              {loading ? 'Wczytywanie...' : `${rows.length} wdrożeń`}
            </span>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </p>
        ) : loading ? (
          <LoadingSpinner message="Wczytywanie rejestru wdrożeń..." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="mdi:rocket-launch-outline"
            title="Brak wdrożeń"
            description={
              onlyActive
                ? 'Żadne wdrożenie obiegu nie obowiązuje dziś. Odznacz filtr, aby zobaczyć historię.'
                : 'Rejestr wdrożeń jest pusty - wdrożenia powstają w kroku "Wdrożenie obiegów".'
            }
          />
        ) : (
          <div className="gw-frame overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Obieg</th>
                  <th className="px-4 py-2.5 font-semibold">Tryb</th>
                  <th className="px-4 py-2.5 font-semibold">Jednostki</th>
                  <th className="px-4 py-2.5 font-semibold">Okres obowiązywania</th>
                  <th className="px-4 py-2.5 font-semibold">Akt</th>
                  <th className="px-4 py-2.5 font-semibold">Stan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.rollout.id} className="align-top hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.modelName}</td>
                    <td className="px-4 py-3">
                      <Badge variant={MODE_VARIANT[row.rollout.mode] ?? 'default'} size="sm">
                        {USAGE_MODE_LABELS[row.rollout.mode] ?? row.rollout.mode}
                      </Badge>
                    </td>
                    <td className="max-w-[16rem] px-4 py-3 text-slate-600">{row.units}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {row.rollout.valid_from}
                      {row.rollout.valid_to ? ` – ${row.rollout.valid_to}` : ' – bezterminowo'}
                    </td>
                    <td className="max-w-[18rem] px-4 py-3 text-slate-600">
                      <span className="block truncate">{row.actLabel}</span>
                      <span className="block text-[11px] text-slate-400">
                        wersja aktu {row.rollout.act_version_no}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.closed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Icon icon="mdi:lock-outline" className="h-3.5 w-3.5" />
                          Zamknięte
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                          <Icon icon="mdi:check-circle-outline" className="h-3.5 w-3.5" />
                          Aktywne
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

RolloutsPage.getLayout = (page: React.ReactElement) => <SectionLayout>{page}</SectionLayout>;

export default RolloutsPage;
