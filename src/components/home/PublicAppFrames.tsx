/**
 * Ramki z linkami publicznymi na stronie startowej.
 *
 * Wzorzec jak przy widgecie "Aplikacje powiązane" (public/related-apps.json),
 * ale tutaj lista plików pochodzi z konfiguracji (`HOME_PUBLIC_APP_SOURCES` w
 * src/configs/home.ts), a zawartość czytana jest w locie z katalogu public/ -
 * dodanie lub zmiana odnośnika nie wymaga przebudowy aplikacji.
 *
 * Format pliku: { "title": "...", "description": "...", "links": [...] }
 * (dozwolona też sama tablica linków, jak w related-apps.json).
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import type { PublicAppLink, PublicAppsFile } from '@/types/homeTiles';

function isPublicAppLink(value: unknown): value is PublicAppLink {
  const link = value as PublicAppLink;
  return !!link && typeof link.title === 'string' && typeof link.url === 'string';
}

/** Nazwa ramki, gdy plik JSON nie ma pola "title" (np. public-apps-1.json). */
function titleFromSource(source: string): string {
  const base = source.split('/').pop() ?? source;
  const name = base.replace(/\.json$/i, '').replace(/[-_]+/g, ' ');
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function isInternalPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

function FrameLink({ link }: { link: PublicAppLink }) {
  const body = (
    <>
      <span className="gw-home-frame-icon">
        <Icon icon={link.icon ?? 'mdi:open-in-new'} className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="gw-home-frame-link-name">{link.title}</span>
        {link.description && <span className="gw-home-frame-link-desc">{link.description}</span>}
      </span>
    </>
  );

  // Wygląd (panel, ikona w granacie, tło po najechaniu) - src/styles/custom.css.
  const itemClass = 'gw-home-frame-link';

  if (isInternalPath(link.url)) {
    return (
      <Link href={link.url} className={itemClass}>
        {body}
      </Link>
    );
  }
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={itemClass}>
      {body}
    </a>
  );
}

interface LoadedFrame {
  title: string;
  description?: string;
  links: PublicAppLink[];
}

interface FrameState {
  source: string;
  data: LoadedFrame | null;
  error: string | null;
}

export const PublicAppFrame: React.FC<{ source: string }> = ({ source }) => {
  // Klucz `source` w stanie zamiast czyszczenia stanu w efekcie - patrz
  // komentarz w src/components/tiles/TileCard.tsx.
  const [loaded, setLoaded] = useState<FrameState | null>(null);
  const current = loaded?.source === source ? loaded : null;

  useEffect(() => {
    let cancelled = false;

    fetch(source, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: unknown) => {
        if (cancelled) return;
        const raw: unknown = json;
        const asFile: PublicAppsFile = Array.isArray(raw) ? {} : (raw as PublicAppsFile);
        const linksRaw: unknown[] = Array.isArray(asFile.links) ? asFile.links : [];
        setLoaded({
          source,
          error: null,
          data: {
            title: asFile.title || titleFromSource(source),
            description: asFile.description,
            links: linksRaw.filter(isPublicAppLink),
          },
        });
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoaded({
            source,
            data: null,
            error: `Nie udało się wczytać listy (${source}): ${err.message}`,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <div className="gw-home-frame">
      {current?.error ? (
        <p className="text-xs text-rose-600">{current.error}</p>
      ) : !current?.data ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
          Wczytywanie odnośników...
        </div>
      ) : (
        <>
          <h3 className="gw-home-frame-title">{current.data.title}</h3>
          {current.data.description && (
            <p className="gw-home-frame-desc">{current.data.description}</p>
          )}
          {current.data.links.length === 0 ? (
            <p className="gw-home-frame-desc mt-3">Brak skonfigurowanych odnośników.</p>
          ) : (
            <ul className="mt-3 space-y-0.5">
              {current.data.links.map((link) => (
                <li key={`${link.title}|${link.url}`}>
                  <FrameLink link={link} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export const PublicAppFrames: React.FC<{ sources: string[] }> = ({ sources }) => {
  if (sources.length === 0) {
    return <p className="gw-home-frame-desc">Brak skonfigurowanych ramek publicznych.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sources.map((source) => (
        <PublicAppFrame key={source} source={source} />
      ))}
    </div>
  );
};

export default PublicAppFrames;
