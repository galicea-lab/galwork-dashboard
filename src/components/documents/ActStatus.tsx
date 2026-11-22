/**
 * Status prawny aktu wewnętrznego na wybrany dzień - redakcja
 * obowiązująca (wersja i daty), akty zmieniające i uchylające, historia
 * redakcji. Dane z `GET /acts/{id}?on=` (galwork-hub, wf/services/legal_acts.py);
 * dokument, który nie jest aktem w repozytorium, nie pokazuje bloku.
 */
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { documentsApi, extractDocumentError } from '@/api/documents';
import { ActRelation, ActState } from '@/types/documents';

interface ActStatusProps {
  documentId: string;
  /** zmiana wartości wymusza ponowne pobranie (np. po wgraniu wersji) */
  refreshKey?: unknown;
}

const STATUS_STYLE: Record<string, string> = {
  '1': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '5': 'bg-sky-50 text-sky-700 border-sky-200',
  '0': 'bg-slate-50 text-slate-600 border-slate-200',
  '3': 'bg-rose-50 text-rose-700 border-rose-200',
  '2': 'bg-rose-50 text-rose-700 border-rose-200',
  '4': 'bg-amber-50 text-amber-700 border-amber-200',
};

const today = () => new Date().toISOString().slice(0, 10);

// podgląd i pobieranie redakcji aktu (GET /acts/{id}/content).
const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const relationLabel = (relation: ActRelation) =>
  `${relation.number ? `${relation.number} - ` : ''}${relation.title} (od ${relation.effective_from})`;

export const ActStatus: React.FC<ActStatusProps> = ({ documentId, refreshKey }) => {
  const [on, setOn] = useState(today);
  const [loaded, setLoaded] = useState<{ key: string; state: ActState | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const loadKey = `${documentId}:${on}:${String(refreshKey ?? '')}`;

  useEffect(() => {
    let cancelled = false;
    documentsApi
      .actState(documentId, on)
      .then((state) => {
        if (!cancelled) setLoaded({ key: loadKey, state });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: loadKey, state: null });
      });
    return () => {
      cancelled = true;
    };
  }, [documentId, on, loadKey]);

  const state = loaded?.state;

  const fileNameFor = (versionNo?: number): string => {
    const latestNo = state?.versions.length
      ? Math.max(...state.versions.map((item) => item.version_no))
      : undefined;
    const selectedNo = versionNo ?? state?.valid_version_no ?? latestNo;
    const version = state?.versions.find((item) => item.version_no === selectedNo);
    return version?.file_name ?? 'akt.pdf';
  };

  const handleContent = async (versionNo?: number, download = false) => {
    const key = `${download ? 'download' : 'open'}:${versionNo ?? 'current'}`;
    setBusy(key);
    setContentError(null);
    const preview = download ? null : window.open('', '_blank');
    try {
      const result = await documentsApi.actContent(documentId, {
        on,
        versionNo,
        download,
      });
      if (download) {
        saveBlob(result.blob, fileNameFor(versionNo));
      } else if (preview) {
        const url = URL.createObjectURL(result.blob);
        preview.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        setContentError('Przeglądarka zablokowała nowe okno. Użyj przycisku pobierania.');
      }
    } catch (error) {
      preview?.close();
      setContentError(await extractDocumentError(error, 'Nie udało się pobrać treści aktu.'));
    } finally {
      setBusy(null);
    }
  };

  if (!state) return null;

  return (
    <div className="mt-2 ml-6 p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-800">Status prawny na dzień</span>
        <input
          type="date"
          value={on}
          onChange={(event) => {
            setOn(event.target.value || today());
            setContentError(null);
          }}
          className="px-1.5 py-0.5 border border-slate-200 rounded bg-white"
        />
        <span
          className={`px-2 py-0.5 rounded border font-semibold ${STATUS_STYLE[state.status_code] ?? STATUS_STYLE['0']}`}
          title={state.status_manual ? 'Status ustawiony ręcznie w repozytorium' : 'Status wyliczony z dat i aktów zmieniających'}
        >
          {state.status}
          {state.status_manual ? ' (ręcznie)' : ''}
        </span>
        {state.valid_version_no && (
          <span>
            obowiązuje redakcja v{state.valid_version_no} od {state.valid_from}
            {state.valid_to ? ` do ${state.valid_to}` : ''}
          </span>
        )}
        {state.versions.length > 0 && (
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleContent()}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <Icon icon="mdi:file-eye-outline" className="h-3.5 w-3.5" />
              {busy === 'open:current' ? 'Otwieranie…' : 'Otwórz PDF'}
            </button>
            <button
              type="button"
              onClick={() => void handleContent(undefined, true)}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <Icon icon="mdi:download" className="h-3.5 w-3.5" />
              {busy === 'download:current' ? 'Pobieranie…' : 'Pobierz PDF'}
            </button>
          </span>
        )}
      </div>

      {contentError && (
        <div role="alert" className="flex items-center gap-1.5 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
          <Icon icon="mdi:alert-circle" className="h-3.5 w-3.5 shrink-0" />
          {contentError}
        </div>
      )}

      {state.amended_by.length > 0 && (
        <div>
          <Icon icon="mdi:file-edit-outline" className="inline w-3.5 h-3.5 mr-1 text-sky-600" />
          Zmieniony przez:{' '}
          {state.amended_by.map((a) => (
            <span key={a.document_id} className="mr-2">
              {relationLabel(a)}
              {a.target_version_no ? `, tekst jednolity v${a.target_version_no}` : ', bez tekstu jednolitego'}
            </span>
          ))}
        </div>
      )}
      {state.repealed_by && (
        <div>
          <Icon icon="mdi:file-cancel-outline" className="inline w-3.5 h-3.5 mr-1 text-rose-600" />
          Uchylony przez: {relationLabel(state.repealed_by)}
        </div>
      )}
      {(state.amends.length > 0 || state.repeals.length > 0) && (
        <div>
          <Icon icon="mdi:arrow-right-bold-outline" className="inline w-3.5 h-3.5 mr-1 text-slate-500" />
          {state.amends.length > 0 && <>Zmienia: {state.amends.map(relationLabel).join('; ')} </>}
          {state.repeals.length > 0 && <>Uchyla: {state.repeals.map(relationLabel).join('; ')}</>}
        </div>
      )}

      <table className="mt-1">
        <tbody>
          {state.versions
            .filter((v) => v.effective_from)
            .map((v) => (
              <tr key={v.version_no} className={v.version_no === state.valid_version_no ? 'font-semibold text-slate-800' : ''}>
                <td className="pr-3">v{v.version_no}</td>
                <td className="pr-3">
                  {v.effective_from} – {v.valid_to ?? '…'}
                </td>
                <td className="pr-3">{v.label || v.file_name}</td>
                <td className="pr-3">{v.sealed && <Icon icon="mdi:seal" className="w-3.5 h-3.5 text-emerald-600" />}</td>
                <td>
                  <span className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleContent(v.version_no)}
                      disabled={busy !== null}
                      aria-label={`Otwórz redakcję v${v.version_no}`}
                      title={`Otwórz redakcję v${v.version_no}`}
                      className="rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Icon icon="mdi:file-eye-outline" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleContent(v.version_no, true)}
                      disabled={busy !== null}
                      aria-label={`Pobierz redakcję v${v.version_no}`}
                      title={`Pobierz redakcję v${v.version_no}`}
                      className="rounded p-0.5 text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                    >
                      <Icon icon="mdi:download" className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ActStatus;
