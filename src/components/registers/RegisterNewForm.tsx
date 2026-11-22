/**
 * Nowy wpis rejestru - formularz startowy modelu
 * (`GET /process-models/{key}/start-form`) i start sprawy. Reguły pól
 * (wymagane w kroku, wartości domyślne) są w schemacie modelu; ostateczną
 * walidację robi hub (`validate_start_data`, 422 przed utworzeniem sprawy).
 * Po zapisie - karta nowego obiektu.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { extractApiError } from '@/api/client';
import { formsApi } from '@/api/forms';
import { processInstancesApi } from '@/api/processInstances';
import { LoadingSpinner } from '@/components/common';
import { SchemaForm } from '@/components/forms';
import { recordPath, registerPath } from '@/configs/sections';
import { hasFormSchema, type ProcessFormRead } from '@/types/forms';
import type { RegisterConfig, SectionConfig } from '@/types/sections';

interface RegisterNewFormProps {
  section: SectionConfig;
  register: RegisterConfig;
}

interface Loaded {
  form: ProcessFormRead | null;
  error: string | null;
}

const valueAt = (data: Record<string, unknown>, path?: string): string => {
  if (!path) return '';
  let node: unknown = data;
  for (const part of path.split('.')) {
    if (!node || typeof node !== 'object') return '';
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node.trim() : node == null ? '' : String(node);
};

export const RegisterNewForm: React.FC<RegisterNewFormProps> = ({ section, register }) => {
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [edited, setEdited] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    formsApi
      .getStartForm(register.model)
      .then((form) => !cancelled && setLoaded({ form, error: null }))
      .catch((err: unknown) => !cancelled && setLoaded({ form: null, error: extractApiError(err) }));
    return () => {
      cancelled = true;
    };
  }, [register.model]);

  const form = loaded?.form ?? null;
  const formData = edited ?? form?.form_data ?? {};

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const title =
        valueAt(formData, register.titleField) ||
        `${register.title} – ${new Date().toLocaleDateString('pl-PL')}`;
      const created = await processInstancesApi.startProcessInstance({
        process_model_key: register.model,
        title,
        data: formData,
      });
      void router.push(recordPath(section, register, created.id));
    } catch (err) {
      setError(extractApiError(err));
      setSubmitting(false);
    }
  };

  if (!loaded) return <LoadingSpinner message="Pobieranie formularza..." />;
  if (loaded.error || !form || !hasFormSchema(form.json_schema)) {
    return (
      <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        {loaded.error
          ? `Nie udało się pobrać formularza: ${loaded.error}`
          : `Model „${register.model}” nie ma opublikowanego formularza startowego.`}
      </div>
    );
  }

  return (
    <div className="gw-frame space-y-4 p-5">
      <SchemaForm
        schema={form.json_schema}
        uiSchema={form.ui_schema}
        formData={formData}
        disabled={submitting}
        error={error}
        onChange={setEdited}
      />
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={() => void router.push(registerPath(section, register))}
          disabled={submitting}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Icon icon={submitting ? 'mdi:loading' : 'mdi:content-save'} className={submitting ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Zapisz
        </button>
      </div>
    </div>
  );
};

export default RegisterNewForm;
