/**
 * Nowy wpis rejestru (np. /it/systemy/nowy) - formularz startowy modelu.
 */
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { RegisterNewForm } from '@/components/registers';
import { registerPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findRegister, findSection, registerPath } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';

const RegisterNewPage = ({ section: sectionSlug, register: registerSlug }: SectionPageProps) => {
  const section = findSection(sectionSlug);
  const register = findRegister(section, registerSlug);
  if (!section || !register) return null;

  return (
    <>
      <Head>
        <title>{`${register.newLabel ?? 'Nowy wpis'} | ${register.title}`}</title>
      </Head>
      <div className="max-w-4xl space-y-4">
        <div>
          <Link
            href={registerPath(section, register)}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <Icon icon="mdi:arrow-left" className="h-4 w-4" />
            {register.title}
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{register.newLabel ?? 'Nowy wpis'}</h1>
        </div>
        {register.canCreate === false ? (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Wpisy tego rejestru powstają automatycznie (np. z ERPNext) – nie dodaje się ich ręcznie.
          </div>
        ) : (
          <RegisterNewForm section={section} register={register} />
        )}
      </div>
    </>
  );
};

RegisterNewPage.getLayout = sectionLayout;

export const getStaticPaths = registerPaths;
export const getStaticProps = sectionProps;

export default RegisterNewPage;
