/**
 * Karta obiektu rejestru (np. /it/systemy/karta?id=<instancja>).
 */
import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/common';
import { RegisterRecord } from '@/components/registers';
import { registerPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findRegister, findSection } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';

const RegisterRecordPage = ({ section: sectionSlug, register: registerSlug }: SectionPageProps) => {
  const router = useRouter();
  const section = findSection(sectionSlug);
  const register = findRegister(section, registerSlug);
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  if (!section || !register) return null;

  return (
    <>
      <Head>
        <title>{`Karta | ${register.title}`}</title>
      </Head>
      <div className="max-w-5xl">
        {!router.isReady ? (
          <LoadingSpinner message="Wczytywanie..." />
        ) : id ? (
          <RegisterRecord key={id} section={section} register={register} instanceId={id} />
        ) : (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Brak identyfikatora wpisu w adresie (?id=).
          </div>
        )}
      </div>
    </>
  );
};

RegisterRecordPage.getLayout = sectionLayout;

export const getStaticPaths = registerPaths;
export const getStaticProps = sectionProps;

export default RegisterRecordPage;
