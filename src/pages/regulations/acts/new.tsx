// pełna strona tworzenia aktu (obok szybkiego modalu z listy aktów).
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import { Icon } from '@iconify/react';
import ActCreateForm from '@/components/regulations/ActCreateForm';
import { LoadingSpinner } from '@/components/common';
import { useCanCreateActState } from '@/hooks/useCanCreateAct';
import SectionLayout from '@/layouts/SectionLayout';

const NewActPage: NextPage = () => {
  const router = useRouter();
  const { canCreateAct, loading } = useCanCreateActState();

  return (
    <>
      <Head>
        <title>Nowy akt | Regulacje i wdrożenia</title>
      </Head>

      <div className="max-w-3xl space-y-5">
        <div>
          <Link
            href="/regulations/acts"
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600"
          >
            <Icon icon="mdi:arrow-left" className="h-4 w-4" />
            Wróć do aktów prawnych
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Dodaj akt do repozytorium</h1>
          <p className="mt-1 text-xs text-slate-500">
            Start obiegu „dokumenty”, wgranie finalnego PDF i rejestracja redakcji z datą
            obowiązywania.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Sprawdzanie uprawnień..." />
        ) : !canCreateAct ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800"
          >
            Nie masz uprawnienia do dodawania aktów w repozytorium regulacji.
          </div>
        ) : (
          <div className="gw-frame p-5">
            <ActCreateForm
              onCreated={(result) => {
                void router.push(`/process-instances/${result.instance_id}`);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

NewActPage.getLayout = (page: React.ReactElement) => <SectionLayout>{page}</SectionLayout>;

export default NewActPage;
