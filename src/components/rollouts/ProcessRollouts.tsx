/**
 * Rejestr wdrożeń obiegu - tryb (testowy / pomocniczy /
 * produkcyjny), jednostki, okres i akt, na podstawie którego obieg jest
 * używany. Wdrożenia powstają wyłącznie z aktu (obieg "Wdrożenie obiegów").
 */
import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { rolloutsApi } from '@/api/rollouts';
import { ProcessRolloutRead, USAGE_MODE_LABELS } from '@/types/rollouts';

interface ProcessRolloutsProps {
  processModelId: string;
}

const MODE_STYLE: Record<string, string> = {
  test: 'bg-rose-50 text-rose-700 border-rose-200',
  auxiliary: 'bg-amber-50 text-amber-700 border-amber-200',
  production: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface Loaded {
  key: string;
  rollouts: ProcessRolloutRead[];
  units: Record<string, string>;
  acts: Record<string, string | null>;
}

const today = () => new Date().toISOString().slice(0, 10);

export const ProcessRollouts: React.FC<ProcessRolloutsProps> = ({ processModelId }) => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rollouts, units] = await Promise.all([
          rolloutsApi.list(processModelId),
          rolloutsApi.orgUnitNames(),
        ]);
        const actIds = Array.from(new Set(rollouts.map((r) => r.act_document_id)));
        const labels = await Promise.all(actIds.map((id) => rolloutsApi.actLabel(id)));
        if (!cancelled) {
          setLoaded({
            key: processModelId,
            rollouts,
            units,
            acts: Object.fromEntries(actIds.map((id, i) => [id, labels[i]])),
          });
        }
      } catch {
        if (!cancelled) setLoaded({ key: processModelId, rollouts: [], units: {}, acts: {} });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processModelId]);

  if (!loaded || loaded.key !== processModelId) return null;
  const now = today();

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-900">Wdrożenia obiegu</h2>
        <p className="text-xs text-slate-500">
          Tryb użycia obiegu w jednostkach organizacyjnych - wyłącznie na podstawie aktu (obieg „Wdrożenie obiegów”).
        </p>
      </div>
      {loaded.rollouts.length === 0 ? (
        <p className="px-6 py-4 text-xs text-slate-500">
          Obieg nie jest wdrożony - mogą go uruchamiać tylko administratorzy procesów (tryb deweloperski).
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {loaded.rollouts.map((r) => {
            const active = r.valid_from <= now && (!r.valid_to || now < r.valid_to);
            const units = r.org_unit_ids.length
              ? r.org_unit_ids.map((id) => loaded.units[id] ?? id).join(', ')
              : 'cała organizacja';
            return (
              <li key={r.id} className={`px-6 py-3 text-xs ${active ? '' : 'opacity-60'}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border font-semibold ${MODE_STYLE[r.mode]}`}>
                    {USAGE_MODE_LABELS[r.mode]}
                  </span>
                  <span className="text-slate-700">
                    {r.valid_from} – {r.valid_to ?? 'bezterminowo'}
                  </span>
                  {active && <span className="text-emerald-700 font-semibold">obowiązuje</span>}
                  <span className="text-slate-500">· {units}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                  <div>
                    <Icon icon="mdi:gavel" className="inline w-3.5 h-3.5 mr-1" />
                    Akt: {loaded.acts[r.act_document_id] ?? r.act_document_id} (wersja {r.act_version_no})
                  </div>
                  {r.previous_procedure && (
                    <div>
                      {r.mode === 'auxiliary' ? 'Dokument źródłowy' : 'Procedura dotychczasowa'}: {r.previous_procedure}
                    </div>
                  )}
                  {r.close_reason && <div>Zamknięte: {r.close_reason}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProcessRollouts;
