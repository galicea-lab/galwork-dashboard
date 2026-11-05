// spis linków do aplikacji powiązanych, czytany w locie z
// pliku JSON (domyślnie public/related-apps.json) - dodanie/usunięcie linku
// to edycja tego pliku, bez przebudowy aplikacji.
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { LoadingSpinner } from '@/components/common';
import {
  DEFAULT_RELATED_APPS_SOURCE,
  type RelatedAppLink,
  type RelatedAppsWidgetConfig,
} from '@/types/dashboardConfig';

function isRelatedAppLink(value: unknown): value is RelatedAppLink {
  const link = value as RelatedAppLink;
  return !!link && typeof link.title === 'string' && typeof link.url === 'string';
}

function LinkBody({ link }: { link: RelatedAppLink }) {
  return (
    <>
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-100">
        <Icon icon={link.icon ?? 'mdi:open-in-new'} className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">{link.title}</p>
        {link.description && <p className="text-[11px] text-slate-500 truncate">{link.description}</p>}
      </div>
    </>
  );
}

export function RelatedAppsWidget({ config }: { config: RelatedAppsWidgetConfig }) {
  const [links, setLinks] = useState<RelatedAppLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const source = config.source || DEFAULT_RELATED_APPS_SOURCE;

  useEffect(() => {
    let cancelled = false;
    fetch(source, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setError(null);
        const raw: unknown[] = Array.isArray(data) ? data : Array.isArray(data?.links) ? data.links : [];
        setLinks(raw.filter(isRelatedAppLink));
      })
      .catch((err) => {
        if (!cancelled) setError(`Nie udało się wczytać listy aplikacji (${source}): ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (loading) {
    return <LoadingSpinner size="sm" message="Wczytywanie linków..." />;
  }
  if (error) {
    return <p className="text-xs text-rose-600">{error}</p>;
  }
  if (links.length === 0) {
    return <p className="text-xs text-slate-500">Brak skonfigurowanych aplikacji.</p>;
  }

  const itemClass = 'flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors group';

  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li key={`${link.title}|${link.url}`}>
          {link.url.startsWith('/') && !link.url.startsWith('//') ? (
            <Link href={link.url} className={itemClass}>
              <LinkBody link={link} />
            </Link>
          ) : (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={itemClass}>
              <LinkBody link={link} />
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export default RelatedAppsWidget;
