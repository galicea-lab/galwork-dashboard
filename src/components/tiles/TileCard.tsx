/**
 * Kafelek kategorii - cały kafelek jest linkiem do podstrony.
 * Licznik pozycji (i opcjonalnie liczba przeterminowanych) pochodzi z API -
 * patrz `computeCount` w src/api/metrics.ts i opis pól `count`/`overdue` w
 * src/types/homeTiles.ts.
 *
 * Wariant wyglądu wybiera `variant`:
 *  - `default` - kafelek w globalnych tokenach `--gw-*` (pulpit sekcji
 *    "Regulacje i wdrożenia" na podstronach),
 *  - `home` - kafelek w stylu galwork-www (`gw-home-tile*`) używany na
 *    publicznej stronie głównej "/" (src/styles/custom.css).
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { computeCount } from '@/api/metrics';
import { extractApiError } from '@/api/client';
import type { CountQuery } from '@/api/metrics';
import type { TileConfig } from '@/types/homeTiles';

interface TileCounts {
  key: string;
  count: number | null;
  overdue: number | null;
  error: string | null;
}

async function loadCount(query?: CountQuery): Promise<number | null> {
  if (!query) return null;
  return computeCount(query);
}

/** Klucz konfiguracji liczników - zmiana wartości w konfiguracji powtarza odczyt. */
function countsKey(tile: TileConfig): string {
  return JSON.stringify([tile.count ?? null, tile.overdue ?? null]);
}

export const TileCard: React.FC<{ tile: TileConfig; variant?: 'default' | 'home' }> = ({
  tile,
  variant = 'default',
}) => {
  const isHome = variant === 'home';
  const rootClass = isHome ? 'gw-home-tile group' : 'gw-tile group p-5';
  const iconClass = isHome
    ? 'gw-home-tile-icon'
    : 'gw-tile-icon flex h-10 w-10 items-center justify-center rounded-xl';
  const overdueClass = isHome ? 'gw-home-tile-overdue' : 'gw-tile-overdue';
  const titleClass = isHome ? 'gw-home-tile-title' : 'gw-tile-title';
  const countClass = isHome ? 'gw-home-tile-count' : 'gw-tile-count';
  const arrowClass = isHome ? 'gw-home-tile-arrow' : 'gw-tile-arrow';

  const hasCount = Boolean(tile.count);
  const hasOverdue = Boolean(tile.overdue);
  const key = countsKey(tile);

  // Stan trzyma klucz, dla którego został pobrany - dzięki temu po zmianie
  // konfiguracji liczniki wracają do stanu "…" bez setState w ciele efektu.
  const [loaded, setLoaded] = useState<TileCounts | null>(null);
  const counts = loaded?.key === key ? loaded : null;

  useEffect(() => {
    if (!hasCount && !hasOverdue) return;
    let cancelled = false;

    Promise.all([loadCount(tile.count), loadCount(tile.overdue)])
      .then(([count, overdue]) => {
        if (!cancelled) setLoaded({ key, count, overdue, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoaded({ key, count: null, overdue: null, error: extractApiError(error) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hasCount, hasOverdue]);

  const countText = !hasCount
    ? 'Przejdź'
    : !counts
    ? '…'
    : counts.error
    ? '—'
    : counts.count ?? '—';

  return (
    <Link href={tile.href} className={rootClass}>
      <div className="flex items-start justify-between gap-3">
        <div className={iconClass}>
          <Icon icon={tile.icon ?? 'mdi:open-in-new'} className="h-5 w-5" />
        </div>
        {hasOverdue && (
          <span
            className={`${overdueClass} rounded-full px-2 py-0.5 text-[11px] font-semibold`}
            title="Liczba pozycji po terminie"
          >
            {!counts ? '…' : counts.error ? '—' : counts.overdue ?? '—'} po terminie
          </span>
        )}
      </div>

      <h3 className={`${titleClass} mt-4 text-base font-bold`}>{tile.title}</h3>
      {tile.description && <p className="mt-1 text-xs text-slate-500">{tile.description}</p>}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className={`${countClass} text-3xl leading-none`}>{countText}</span>
          {hasCount && <span className="text-[11px] text-slate-500">pozycji</span>}
        </div>
        <Icon icon="mdi:arrow-right" className={`${arrowClass} h-4 w-4 transition-colors`} />
      </div>

      {counts?.error && <p className="mt-2 text-[11px] text-rose-600">{counts.error}</p>}
    </Link>
  );
};

export default TileCard;
