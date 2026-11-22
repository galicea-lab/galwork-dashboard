/**
 * Dokumenty sprawy - lista (główny pierwszy), wgranie pliku jako
 * nowego dokumentu albo nowej wersji istniejącego, historia wersji ze skrótem
 * sha256 i pobranie pliku (hub weryfikuje skrót przed wydaniem).
 * Wcześniejsze wersje zostają - nie ma usuwania ani nadpisywania.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { documentsApi, extractDocumentError } from '@/api/documents';
import { DocumentDetail, DocumentLinkRole, InstanceDocumentRead } from '@/types/documents';
import { ActStatus } from './ActStatus';

interface InstanceDocumentsProps {
  instanceId: string;
  /** Po wgraniu pliku (np. "Sprawdź teraz" dla kroku czekającego na dokument). */
  onUploaded?: () => Promise<unknown> | void;
}

const ROLE_LABEL: Record<DocumentLinkRole, string> = {
  main: 'główny',
  attachment: 'załącznik',
  related: 'powiązany',
};

const ACCEPT = '.pdf,.odt,.ods,.docx,.xlsx,.doc,.txt,.png,.jpg,.jpeg,.tif,.tiff,.xml';

const size = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;

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

export const InstanceDocuments: React.FC<InstanceDocumentsProps> = ({ instanceId, onUploaded }) => {
  const [items, setItems] = useState<InstanceDocumentRead[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<DocumentDetail | null>(null);
  // cel wgrania: nowy dokument (null) albo nowa wersja dokumentu o danym id
  const [target, setTarget] = useState<string | null>(null);
  const [role, setRole] = useState<DocumentLinkRole>('attachment');
  const [title, setTitle] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const list = await documentsApi.list(instanceId);
      setItems(list);
      setForbidden(false);
      // pierwszy dokument sprawy domyślnie jako główny
      if (list.length === 0) setRole('main');
    } catch {
      // brak uprawnień (403) albo hub bez API dokumentów - blok się nie pokazuje
      setItems([]);
      setForbidden(true);
    }
  }, [instanceId]);

  useEffect(() => {
    let cancelled = false;
    documentsApi
      .list(instanceId)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setForbidden(false);
        if (list.length === 0) setRole('main');
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setForbidden(true);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  if (items === null || forbidden) return null;

  const chooseFile = (documentId: string | null) => {
    setTarget(documentId);
    setError(null);
    setNotice(null);
    fileInput.current?.click();
  };

  const upload = async (file: File) => {
    setBusy('upload');
    setError(null);
    setNotice(null);
    try {
      const document = await documentsApi.upload(instanceId, {
        file,
        documentId: target ?? undefined,
        role: target ? undefined : role,
        title: target ? undefined : title.trim() || undefined,
      });
      setNotice(
        target
          ? `Dodano wersję ${document.current_version_no} dokumentu: ${document.title}`
          : `Dodano dokument: ${document.title}`
      );
      setTitle('');
      setExpanded(null);
      await load();
      if (onUploaded) await onUploaded();
    } catch (err) {
      setError(await extractDocumentError(err, 'Nie udało się wgrać pliku.'));
    } finally {
      setBusy(null);
      setTarget(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const toggleVersions = async (documentId: string) => {
    if (expanded?.id === documentId) {
      setExpanded(null);
      return;
    }
    setBusy(`detail:${documentId}`);
    setError(null);
    try {
      setExpanded(await documentsApi.detail(instanceId, documentId));
    } catch (err) {
      setError(await extractDocumentError(err, 'Nie udało się pobrać historii wersji.'));
    } finally {
      setBusy(null);
    }
  };

  const download = async (documentId: string, fileName: string, versionNo?: number) => {
    const key = `get:${documentId}:${versionNo ?? ''}`;
    setBusy(key);
    setError(null);
    try {
      const { blob } = await documentsApi.download(instanceId, documentId, versionNo);
      saveBlob(blob, fileName);
    } catch (err) {
      setError(await extractDocumentError(err, 'Nie udało się pobrać pliku.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Dokumenty sprawy</h3>
          <p className="text-xs text-slate-500">
            Każdy plik dostaje skrót SHA-256; nowa wersja nie usuwa poprzednich.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tytuł (opcjonalnie)"
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg w-44"
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as DocumentLinkRole)}
            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="main">główny</option>
            <option value="attachment">załącznik</option>
            <option value="related">powiązany</option>
          </select>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => chooseFile(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon
              icon={busy === 'upload' && !target ? 'mdi:loading' : 'mdi:file-upload-outline'}
              className={`w-4 h-4 ${busy === 'upload' && !target ? 'animate-spin' : ''}`}
            />
            Dodaj plik
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400">Sprawa nie ma jeszcze dokumentów.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map(({ document, role: linkRole }) => {
            const version = document.current_version;
            const open = expanded?.id === document.id;
            return (
              <li key={document.id} className="py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon icon="mdi:file-document-outline" className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900">{document.title}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          linkRole === 'main' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ROLE_LABEL[linkRole]}
                      </span>
                      {document.current_version_no ? (
                        <span className="text-slate-400">wersja {document.current_version_no}</span>
                      ) : null}
                    </div>
                    {version && (
                      <div className="mt-0.5 ml-6 text-[11px] text-slate-500">
                        {version.file_name} · {size(version.size_bytes)} ·{' '}
                        <span className="font-mono" title={version.sha256}>
                          sha256 {version.sha256.slice(0, 12)}…
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {version && (
                      <button
                        type="button"
                        disabled={busy !== null}
                        onClick={() => download(document.id, version.file_name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Icon icon="mdi:download" className="w-4 h-4" />
                        Pobierz
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => chooseFile(document.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Icon
                        icon={busy === 'upload' && target === document.id ? 'mdi:loading' : 'mdi:file-replace-outline'}
                        className={`w-4 h-4 ${busy === 'upload' && target === document.id ? 'animate-spin' : ''}`}
                      />
                      Nowa wersja
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => toggleVersions(document.id)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      <Icon icon={open ? 'mdi:chevron-up' : 'mdi:history'} className="w-4 h-4" />
                      Historia
                    </button>
                  </div>
                </div>

                {/* 2026-11-17: dokument główny będący aktem w repozytorium - status prawny */}
                {linkRole === 'main' && (
                  <ActStatus documentId={document.id} refreshKey={document.current_version_no} />
                )}

                {open && expanded && (
                  <table className="mt-2 ml-6 text-[11px] text-slate-600">
                    <tbody>
                      {[...expanded.versions].reverse().map((v) => (
                        <tr key={v.id}>
                          <td className="pr-3 py-0.5 font-semibold">v{v.version_no}</td>
                          <td className="pr-3">{new Date(v.uploaded_at).toLocaleString()}</td>
                          <td className="pr-3">{v.uploaded_by?.name || v.uploaded_by?.email || '—'}</td>
                          <td className="pr-3">{v.label || v.file_name}</td>
                          <td className="pr-3">{v.effective_from ? `obowiązuje od ${v.effective_from}` : ''}</td>
                          <td className="pr-3 font-mono" title={v.sha256}>
                            {v.sha256.slice(0, 12)}…
                          </td>
                          <td>
                            <button
                              type="button"
                              disabled={busy !== null}
                              onClick={() => download(document.id, v.file_name, v.version_no)}
                              className="text-blue-600 hover:underline disabled:opacity-50"
                            >
                              pobierz
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {notice && <p className="mt-3 text-xs text-emerald-700">{notice}</p>}
      {error && <p className="mt-3 text-xs text-rose-700">{error}</p>}
    </div>
  );
};

export default InstanceDocuments;
