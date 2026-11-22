/**
 * dyskusje o sprawie w komunikatorze (domyślnie Mattermost).
 * Prosty dodatek: "Rozpocznij dyskusję" otwiera komunikator, a link do wątku
 * (permalink) wkleja się do sprawy. Bez integracji zwrotnej - ustalenia
 * przenosi się do formularza obiegu.
 */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { discussionsApi } from '@/api/discussions';
import { DiscussionList } from '@/types/discussions';

interface InstanceDiscussionsProps {
  instanceId: string;
}

export const InstanceDiscussions: React.FC<InstanceDiscussionsProps> = ({ instanceId }) => {
  const [loaded, setLoaded] = useState<{ key: string; data: DiscussionList | null } | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    discussionsApi
      .list(instanceId)
      .then((data) => {
        if (!cancelled) setLoaded({ key: instanceId, data });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: instanceId, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  const data = loaded?.key === instanceId ? loaded.data : null;
  if (!data) return null;

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await discussionsApi.add(instanceId, url.trim(), title.trim());
      setUrl('');
      setTitle('');
      setLoaded({ key: instanceId, data: await discussionsApi.list(instanceId) });
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setError(typeof detail === 'string' ? detail : 'Nie udało się dodać linku.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">Dyskusje ({data.provider})</h3>
          <p className="text-xs text-slate-500">
            Konsultacje w komunikatorze. Ustalenia przenieś do formularza sprawy - dyskusja nie jest dokumentacją.
          </p>
        </div>
        {data.start_url && (
          <a
            href={data.start_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            <Icon icon="mdi:forum-outline" className="w-4 h-4" />
            Rozpocznij dyskusję
          </a>
        )}
      </div>

      {data.items.length > 0 && (
        <ul className="mb-3 space-y-1 text-xs">
          {data.items.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-2">
              <Icon icon="mdi:link-variant" className="w-4 h-4 text-slate-400" />
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                {d.title || d.url}
              </a>
              <span className="text-slate-400">
                {d.created_by?.name || d.created_by?.email} · {new Date(d.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Link do wątku (https://...)"
          className="flex-1 min-w-48 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
        />
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Temat (opcjonalnie)"
          className="w-48 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
        />
        <button
          type="button"
          disabled={busy || !url.trim()}
          onClick={add}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-50"
        >
          <Icon icon={busy ? 'mdi:loading' : 'mdi:link-plus'} className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Dodaj link
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
};

export default InstanceDiscussions;
