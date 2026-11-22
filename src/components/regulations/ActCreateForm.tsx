// współdzielony formularz tworzenia aktu - używany przez modal
// i pełną stronę /regulations/acts/new (S2.2 wariant A).
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { ACT_REPOSITORY_MODEL_KEY, ActCreationError, actsApi } from '@/api/acts';
import { extractApiError } from '@/api/client';
import { formsApi } from '@/api/forms';
import { LoadingSpinner } from '@/components/common';
import { SchemaForm } from '@/components/forms';
import type { ActCreateResult } from '@/types/acts';
import { hasFormSchema, type ProcessFormRead } from '@/types/forms';

interface ActCreateFormProps {
  onCreated: (result: ActCreateResult) => void;
  onCancel?: () => void;
}

const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();

const isPdfFile = (file: File): boolean =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

export const ActCreateForm: React.FC<ActCreateFormProps> = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState<ProcessFormRead | null>(null);
  const [formLoading, setFormLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedInstanceId, setFailedInstanceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    formsApi
      .getStartForm(ACT_REPOSITORY_MODEL_KEY)
      .then((payload) => {
        if (!cancelled) {
          setForm(payload);
          setFormData(payload.form_data ?? {});
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setFormError(extractApiError(err));
      })
      .finally(() => {
        if (!cancelled) setFormLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const formReady = Boolean(form && hasFormSchema(form.json_schema));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formReady) return;

    setError(null);
    setFailedInstanceId(null);

    const title = asText(formData['Tytuł dokumentu']) || asText(formData['Nr dokumentu']);
    if (!title) {
      setError('Uzupełnij „Tytuł dokumentu” albo „Nr dokumentu”.');
      return;
    }
    if (!file) {
      setError('Wybierz plik aktu PDF.');
      return;
    }
    if (!isPdfFile(file)) {
      setError('Wgraj plik PDF (rozszerzenie .pdf).');
      return;
    }

    setSubmitting(true);
    try {
      const result = await actsApi.createRepositoryAct({
        form_data: formData,
        file,
        title,
        business_key: asText(formData['Nr dokumentu']) || null,
      });
      onCreated(result);
    } catch (err) {
      if (err instanceof ActCreationError) {
        setError(err.message);
        setFailedInstanceId(err.instanceId ?? null);
      } else {
        setError(extractApiError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formLoading ? (
        <LoadingSpinner message="Pobieranie formularza Dokumenty-UZ..." />
      ) : formError ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          Nie udało się pobrać formularza startowego: {formError}
        </div>
      ) : !formReady ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          Model „dokumenty” nie ma opublikowanego formularza startowego. Opublikuj model w
          galwork-hub i spróbuj ponownie.
        </div>
      ) : (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-700">Dane aktu</p>
            <SchemaForm
              schema={form!.json_schema}
              uiSchema={form!.ui_schema}
              formData={formData}
              disabled={submitting}
              onChange={setFormData}
            />
          </div>

          <div>
            <label htmlFor="act-file" className="mb-1 block text-xs font-semibold text-slate-700">
              Plik aktu (PDF) <span className="text-rose-500">*</span>
            </label>
            <input
              id="act-file"
              type="file"
              accept="application/pdf,.pdf"
              disabled={submitting}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
                setFailedInstanceId(null);
              }}
              aria-describedby="act-file-hint"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p id="act-file-hint" className="mt-1 text-[11px] text-slate-500">
              {file
                ? `Wybrano: ${file.name}`
                : 'Finalny PDF, który zostanie wgrany jako wersja główna dokumentu.'}
            </p>
          </div>
        </>
      )}

      {error && (
        <div
          id="act-file-error"
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          <Icon icon="mdi:alert-circle" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          {failedInstanceId && (
            <Link
              href={`/process-instances/${failedInstanceId}`}
              className="font-semibold underline underline-offset-2"
            >
              Otwórz sprawę
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            Anuluj
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !formReady || !file || Boolean(formError)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting && <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />}
          <Icon icon="mdi:content-save" className="h-4 w-4" />
          Zapisz akt
        </button>
      </div>
    </form>
  );
};

export default ActCreateForm;
