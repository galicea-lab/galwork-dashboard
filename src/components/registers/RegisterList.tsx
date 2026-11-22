/**
 * Lista obiektów rejestru (custom_dashboard2.md §4.3).
 *
 * Kolumny pochodzą z `metadata_extraction_paths` modelu (tytuły i formaty z
 * formularzy, `GET /process-models/{key}/metadata-fields`), dane z
 * `GET /process-instances` z wyszukiwaniem `q`, filtrami `m.<klucz>` i
 * sortowaniem (galwork-hub, H2). Lista pokazuje tylko sprawy widoczne dla
 * użytkownika (H3). Wiersz prowadzi do karty obiektu.
 *
 * Zestawienie (`report`) to ta sama lista z ustalonym filtrem, sortowaniem i
 * kolumnami oraz eksportem do CSV.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { extractApiError } from '@/api/client';
import { EXPORT_LIMIT, registersApi } from '@/api/registers';
import { LoadingSpinner, Pagination } from '@/components/common';
import { ProcessInstanceStatusBadge } from '@/components/process-instances/ProcessInstanceStatusBadge';
import { recordPath } from '@/configs/sections';
import type {
  PageProcessInstanceRead,
  ProcessInstanceFilterParams,
  ProcessInstanceRead,
  ProcessInstanceStatus,
} from '@/types/processInstances';
import type { MetadataField, RegisterConfig, ReportConfig, SectionConfig } from '@/types/sections';
import { downloadText, filterOptions, formatDateTime, formatValue, toCsv } from './format';

interface RegisterListProps {
  section: SectionConfig;
  register: RegisterConfig;
  /** Zestawienie: ustalony filtr, sortowanie, status i kolumny. */
  report?: ReportConfig;
}

const STATUS_OPTIONS: { value: ProcessInstanceStatus | ''; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  { value: 'running', label: 'Aktywne (w toku)' },
  { value: 'waiting', label: 'Oczekujące' },
  { value: 'completed', label: 'Zakończone / wycofane' },
  { value: 'cancelled', label: 'Anulowane' },
];

interface Loaded<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export const RegisterList: React.FC<RegisterListProps> = ({ section, register, report }) => {
  const router = useRouter();
  const [fieldsState, setFieldsState] = useState<Loaded<MetadataField[]> | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<ProcessInstanceStatus | ''>(
    (report ? report.status : register.defaultStatus) ?? ''
  );
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(report?.sort ?? '-updated_at');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pageState, setPageState] = useState<Loaded<PageProcessInstanceRead> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    registersApi
      .metadataFields(register.model)
      .then((data) => !cancelled && setFieldsState({ key: register.model, data, error: null }))
      .catch((err: unknown) =>
        !cancelled && setFieldsState({ key: register.model, data: [], error: extractApiError(err) })
      );
    return () => {
      cancelled = true;
    };
  }, [register.model]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const allFields = useMemo(() => fieldsState?.data ?? [], [fieldsState]);
  const columns = useMemo(() => {
    const wanted = report?.columns ?? register.columns;
    return wanted ? allFields.filter((field) => wanted.includes(field.key)) : allFields;
  }, [allFields, report, register.columns]);
  const filterFields = useMemo(
    () => (report ? [] : allFields.filter((field) => filterOptions(field) !== null)),
    [allFields, report]
  );

  const params = useMemo<ProcessInstanceFilterParams>(() => {
    const result: ProcessInstanceFilterParams = {
      process_model_key: register.model,
      limit,
      offset,
      sort,
      status: status || undefined,
      q: debouncedQuery || undefined,
    };
    for (const [key, value] of Object.entries({ ...filters, ...(report?.filter ?? {}) })) {
      if (value) result[`m.${key}`] = value;
    }
    return result;
  }, [register.model, limit, offset, sort, status, debouncedQuery, filters, report]);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    registersApi
      .list(params)
      .then((data) => !cancelled && setPageState({ key: paramsKey, data, error: null }))
      .catch((err: unknown) =>
        !cancelled && setPageState({ key: paramsKey, data: null, error: extractApiError(err) })
      );
    return () => {
      cancelled = true;
    };
  }, [params, paramsKey]);

  const loading = !pageState || pageState.key !== paramsKey;
  const page = pageState?.data;
  const error = pageState?.error ?? null;

  const toggleSort = (name: string) => {
    setOffset(0);
    setSort((current) => (current === name ? `-${name}` : name));
  };
  const sortIcon = (name: string) =>
    sort === name ? 'mdi:arrow-up' : sort === `-${name}` ? 'mdi:arrow-down' : 'mdi:unfold-more-horizontal';

  const cellText = (item: ProcessInstanceRead, field: MetadataField) =>
    formatValue(item.metadata?.[field.key], field);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const all = await registersApi.list({ ...params, limit: EXPORT_LIMIT, offset: 0 });
      const header = columns.length ? columns.map((field) => field.title) : ['Tytuł'];
      const rows = all.items.map((item) =>
        columns.length ? columns.map((field) => cellText(item, field)) : [item.title]
      );
      const name = report?.slug ?? register.slug;
      downloadText(toCsv([...header, 'Status'], rows.map((row, i) => [...row, all.items[i].status])), `${name}.csv`);
    } catch (err) {
      setExportError(extractApiError(err));
    } finally {
      setExporting(false);
    }
  };

  const openRecord = (item: ProcessInstanceRead) => {
    void router.push(recordPath(section, register, item.id));
  };

  return (
    <div className="gw-frame overflow-hidden">
      <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-[14rem] flex-1">
          <label htmlFor="register-search" className="mb-1 block text-[11px] font-semibold text-slate-600">
            Szukaj
          </label>
          <div className="relative">
            <Icon icon="mdi:magnify" className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
            <input
              id="register-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOffset(0);
              }}
              placeholder="Nazwa, numer albo wartość kolumny"
              className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {!report && (
          <div>
            <label htmlFor="register-status" className="mb-1 block text-[11px] font-semibold text-slate-600">
              Status
            </label>
            <select
              id="register-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ProcessInstanceStatus | '');
                setOffset(0);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {filterFields.map((field) => (
          <div key={field.key}>
            <label htmlFor={`filter-${field.key}`} className="mb-1 block text-[11px] font-semibold text-slate-600">
              {field.title}
            </label>
            <select
              id={`filter-${field.key}`}
              value={filters[field.key] ?? ''}
              onChange={(event) => {
                setFilters((current) => ({ ...current, [field.key]: event.target.value }));
                setOffset(0);
              }}
              className="max-w-[12rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800"
            >
              <option value="">Wszystkie</option>
              {(filterOptions(field) ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || loading}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Icon icon={exporting ? 'mdi:loading' : 'mdi:file-delimited-outline'} className={exporting ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Eksport CSV
        </button>
      </div>

      {(error || exportError || fieldsState?.error) && (
        <div role="alert" className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error ?? exportError ?? `Kolumny listy: ${fieldsState?.error}`}
        </div>
      )}

      {loading && !page ? (
        <LoadingSpinner message="Wczytywanie rejestru..." />
      ) : !page || page.items.length === 0 ? (
        <div className="px-4 py-10 text-center text-xs text-slate-500">
          Brak wpisów{query || Object.values(filters).some(Boolean) ? ' spełniających kryteria' : ''}.
          {register.canCreate !== false && !report && (
            <>
              {' '}
              <Link href={`/${section.slug}/${register.slug}/nowy`} className="font-semibold text-blue-600 hover:underline">
                {register.newLabel ?? 'Nowy wpis'}
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {columns.length === 0 && (
                  <th className="px-4 py-2">
                    <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-1">
                      Tytuł <Icon icon={sortIcon('title')} className="h-3.5 w-3.5" />
                    </button>
                  </th>
                )}
                {columns.map((field) => (
                  <th key={field.key} className="whitespace-nowrap px-4 py-2">
                    <button type="button" onClick={() => toggleSort(`m.${field.key}`)} className="inline-flex items-center gap-1">
                      {field.title} <Icon icon={sortIcon(`m.${field.key}`)} className="h-3.5 w-3.5" />
                    </button>
                  </th>
                ))}
                <th className="px-4 py-2">Status</th>
                <th className="whitespace-nowrap px-4 py-2">
                  <button type="button" onClick={() => toggleSort('updated_at')} className="inline-flex items-center gap-1">
                    Zmiana <Icon icon={sortIcon('updated_at')} className="h-3.5 w-3.5" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {page.items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => openRecord(item)}
                  className="cursor-pointer hover:bg-blue-50/40"
                >
                  {columns.length === 0 && (
                    <td className="px-4 py-2 font-medium text-slate-800">
                      <Link href={recordPath(section, register, item.id)} onClick={(event) => event.stopPropagation()}>
                        {item.title}
                      </Link>
                    </td>
                  )}
                  {columns.map((field, index) => (
                    <td key={field.key} className={`px-4 py-2 ${index === 0 ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                      {index === 0 ? (
                        <Link href={recordPath(section, register, item.id)} onClick={(event) => event.stopPropagation()}>
                          {cellText(item, field) === '—' ? item.title : cellText(item, field)}
                        </Link>
                      ) : (
                        cellText(item, field)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <ProcessInstanceStatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-slate-500">{formatDateTime(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {page && page.total > 0 && (
        <Pagination
          total={page.total}
          limit={limit}
          offset={offset}
          onPageChange={setOffset}
          onLimitChange={(value) => {
            setLimit(value);
            setOffset(0);
          }}
        />
      )}
    </div>
  );
};

export default RegisterList;
