/**
 * Karta obiektu rejestru (custom_dashboard2.md §3.2, §4.3).
 *
 * Podstawą jest DANE OBIEKTU, nie przebieg sprawy: `GET /process-instances/
 * {id}/record` zwraca formularz kroku `galwork.record_step` przefiltrowany
 * przez `x-permissions`, tylko do odczytu, z bieżącymi danymi przyciętymi do
 * pól formularza. „Edytuj” otwiera zadanie `galwork.edit_step` (jeśli
 * użytkownik może je wykonać), „Przebieg sprawy” - stronę instancji.
 * Model bez formularza karty od razu przekierowuje na przebieg.
 *
 * Do czasu `SchemaView` w @galicea-lab/rjsf-widgets (W1) karta to formularz
 * zablokowany (W2).
 */
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { extractApiError } from '@/api/client';
import { registersApi } from '@/api/registers';
import { tasksApi } from '@/api/tasks';
import { LoadingSpinner } from '@/components/common';
import { SchemaForm } from '@/components/forms';
import { PrintActions } from '@/components/prints';
import { ProcessInstanceStatusBadge } from '@/components/process-instances/ProcessInstanceStatusBadge';
import { TaskCompleteModal } from '@/components/tasks/TaskCompleteModal';
import { registerPath } from '@/configs/sections';
import type { ProcessInstanceRecordRead, RegisterConfig, SectionConfig } from '@/types/sections';
import type { TaskCompleteRequest } from '@/types/tasks';

interface RegisterRecordProps {
  section: SectionConfig;
  register: RegisterConfig;
  instanceId: string;
}

interface Loaded {
  key: string;
  data: ProcessInstanceRecordRead | null;
  error: string | null;
}

export const RegisterRecord: React.FC<RegisterRecordProps> = ({ section, register, instanceId }) => {
  const router = useRouter();
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<Loaded | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const requestKey = `${instanceId}:${reload}`;

  useEffect(() => {
    let cancelled = false;
    registersApi
      .record(instanceId)
      .then((data) => !cancelled && setState({ key: requestKey, data, error: null }))
      .catch((err: unknown) => !cancelled && setState({ key: requestKey, data: null, error: extractApiError(err) }));
    return () => {
      cancelled = true;
    };
  }, [instanceId, requestKey]);

  const record = state?.data ?? null;
  const loading = !state || (state.key !== requestKey && !record);

  useEffect(() => {
    if (record && !record.has_form) {
      void router.replace(`/process-instances/${record.instance_id}`);
    }
  }, [record, router]);

  const handleComplete = useCallback(
    async (taskId: string, request: TaskCompleteRequest) => {
      const result = await tasksApi.completeTask(taskId, request);
      setEditOpen(false);
      setReload((value) => value + 1);
      return result;
    },
    []
  );

  if (loading) return <LoadingSpinner message="Wczytywanie karty..." />;
  if (state?.error || !record) {
    return (
      <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
        Nie udało się wczytać karty: {state?.error ?? 'brak danych'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={registerPath(section, register)}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <Icon icon="mdi:arrow-left" className="h-4 w-4" />
            {register.title}
          </Link>
          <h1 className="text-xl font-bold text-slate-900">{record.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <ProcessInstanceStatusBadge status={record.status} />
            {record.record_step && <span>Karta: {record.record_step}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {record.edit_task_id && (
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Icon icon="mdi:pencil" className="h-4 w-4" />
              Edytuj
            </button>
          )}
          <Link
            href={`/process-instances/${record.instance_id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Icon icon="mdi:timeline-clock-outline" className="h-4 w-4" />
            Przebieg sprawy
          </Link>
        </div>
      </div>

      <div className="gw-frame p-5">
        <SchemaForm
          schema={record.json_schema}
          uiSchema={record.ui_schema}
          formData={record.form_data}
          disabled
        />
      </div>

      {record.prints.length > 0 && <PrintActions instanceId={record.instance_id} title="Wydruki" />}

      {record.edit_task_id && (
        <TaskCompleteModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          taskId={record.edit_task_id}
          taskName={record.edit_task_name ?? 'Edycja'}
          onConfirm={handleComplete}
        />
      )}
    </div>
  );
};

export default RegisterRecord;
