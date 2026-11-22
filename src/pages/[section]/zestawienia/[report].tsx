/**
 * Zestawienie sekcji (np. /it/zestawienia/bez-umowy-powierzenia) -
 * lista rejestru z ustalonym filtrem, sortowaniem i kolumnami, eksport CSV.
 */
import React from 'react';
import Head from 'next/head';
import { RegisterList } from '@/components/registers';
import { reportPaths, sectionProps, type SectionPageProps } from '@/components/registers/staticPaths';
import { findRegister, findReport, findSection } from '@/configs/sections';
import { sectionLayout } from '@/layouts/RegisterSectionLayout';

const ReportPage = ({ section: sectionSlug, report: reportSlug }: SectionPageProps) => {
  const section = findSection(sectionSlug);
  const report = findReport(section, reportSlug);
  const register = findRegister(section, report?.register);
  if (!section || !report || !register) return null;

  return (
    <>
      <Head>
        <title>{`${report.title} | ${section.title}`}</title>
      </Head>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{report.title}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {report.description ? `${report.description} ` : ''}Źródło: {register.title}.
          </p>
        </div>
        <RegisterList section={section} register={register} report={report} />
      </div>
    </>
  );
};

ReportPage.getLayout = sectionLayout;

export const getStaticPaths = reportPaths;
export const getStaticProps = sectionProps;

export default ReportPage;
