/**
 * AKTY PRAWNE - repozytorium regulacji wewnętrznych.
 *
 * Wyszukiwarka korzysta z `GET /acts?q=&limit=` (galwork-hub:
 * wf/routers/legal_act_router.py), a status prawny aktu na wybrany dzień
 * (redakcje, akty zmieniające i uchylające) z `GET /acts/{id}?on=` -
 * prezentowany w oknie modalnym komponentem ActStatus, tym samym, który
 * pokazuje dokumenty sprawy.
 *
 * 2026-11-21: „Dodaj akt” startuje obiegi `dokumenty`, wgrywa PDF z rolą
 * main i przechodzi do sprawy - wariant bez pełnego obiegu. 
 * Widoczność przycisku wynika z GET /v1/wf/me/permissions 
 * (grupy z [wf] act_editor_groups / act_editor).
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { Icon } from '@iconify/react';
import { legalActsApi } from '@/api/legalActs';
import type { ActOption } from '@/api/legalActs';
import { extractApiError } from '@/api/client';
import { ActStatus } from '@/components/documents/ActStatus';
import { EmptyState, LoadingSpinner, Modal } from '@/components/common';
import NewActModal from '@/components/regulations/NewActModal';
import { useCanCreateAct } from '@/hooks/useCanCreateAct';
import SectionLayout from '@/layouts/SectionLayout';

const SEARCH_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

const ActsPage: NextPage = () => {
  const router = useRouter();
  const canCreateAct = useCanCreateAct();
  const [query, setQuery] = useState('');
  const [acts, setActs] = useState<ActOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ActOption | null>(null);
  const [newActOpen, setNewActOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      legalActsApi
        .listActs({ q: query.trim() || undefined, limit: SEARCH_LIMIT })
        .then((list) => {
          if (!cancelled) setActs(list);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError(extractApiError(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <>
      <Head>
        <title>Akty prawne | Regulacje i wdrożenia</title>
      </Head>

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Akty prawne</h1>
            <p className="mt-1 text-xs text-slate-500">
              Akty wewnętrzne z repozytorium regulacji. Wybierz akt, aby zobaczyć jego status
              prawny na wybrany dzień, redakcje oraz akty zmieniające i uchylające.
            </p>
          </div>
          {canCreateAct && (
            <div className="flex items-center gap-2">
              <Link
                href="/regulations/acts/new"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Icon icon="mdi:form-select" className="h-4 w-4" />
                Pełny formularz
              </Link>
              <button
                type="button"
                onClick={() => setNewActOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Icon icon="mdi:plus" className="h-4 w-4" />
                Dodaj akt
              </button>
            </div>
          )}
        </div>

        <div className="gw-frame p-4">
          <label htmlFor="acts-search" className="block text-xs font-semibold text-slate-700">
            Szukaj aktu (numer lub tytuł)
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Icon
                icon="mdi:magnify"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                id="acts-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="np. regulamin organizacyjny"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              {loading ? 'Szukanie...' : `${acts.length} pozycji`}
            </span>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </p>
        ) : loading ? (
          <LoadingSpinner message="Wczytywanie aktów..." />
        ) : acts.length === 0 ? (
          <EmptyState
            icon="mdi:book-search-outline"
            title="Brak aktów"
            description={query.trim() ? 'Nie znaleziono aktu o podanym numerze lub tytule.' : 'Repozytorium regulacji jest puste lub nie masz do niego dostępu.'}
          />
        ) : (
          <ul className="gw-frame divide-y divide-slate-100">
            {acts.map((act) => (
              <li key={act.value}>
                <button
                  type="button"
                  onClick={() => setSelected(act)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon icon="mdi:book-law" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-800">
                        {act.label}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">{act.value}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-blue-600">
                    Status prawny <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.label ?? 'Status aktu'}
        subtitle="Status prawny aktu na wybrany dzień (GET /acts/{id})"
        maxWidth="3xl"
      >
        {selected && <ActStatus documentId={selected.value} />}
      </Modal>

      {newActOpen && (
        <NewActModal
          isOpen
          onClose={() => setNewActOpen(false)}
          onCreated={(result) => {
            setNewActOpen(false);
            void router.push(`/process-instances/${result.instance_id}`);
          }}
        />
      )}
    </>
  );
};

ActsPage.getLayout = (page: React.ReactElement) => <SectionLayout>{page}</SectionLayout>;

export default ActsPage;
