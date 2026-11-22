/**
 * Lista obiektów rejestru albo słownika sekcji (np. /it/systemy).
 */
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { RegisterList } from '@/components/registers';
import { registerPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findRegister, findSection, registerPath } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';

const RegisterPage = ({ section: sectionSlug, register: registerSlug }: SectionPageProps) => {
  const section = findSection(sectionSlug);
  const register = findRegister(section, registerSlug);
  if (!section || !register) return null;

  return (
    <>
      <Head>
        <title>{`${register.title} | ${section.title}`}</title>
      </Head>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{register.title}</h1>
            {register.description && <p className="mt-1 text-xs text-slate-500">{register.description}</p>}
          </div>
          {register.canCreate !== false && (
            <Link
              href={`${registerPath(section, register)}/nowy`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Icon icon="mdi:plus" className="h-4 w-4" />
              {register.newLabel ?? 'Nowy wpis'}
            </Link>
          )}
        </div>
        <RegisterList section={section} register={register} />
      </div>
    </>
  );
};

RegisterPage.getLayout = sectionLayout;

export const getStaticPaths = registerPaths;
export const getStaticProps = sectionProps;

export default RegisterPage;
