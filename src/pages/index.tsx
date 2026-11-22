/**
 * STRONA GŁÓWNA dashboardu (publiczny adres "/").
 *
 * Zawiera tylko ogólne informacje o systemie i jego przeznaczeniu (dashboard
 * dla zalogowanych użytkowników) - bez menu bocznego (StartLayout). Wygląd
 * nawiązuje do strony informacyjnej galwork-www (granat + złoto, hero w
 * gradiencie, karty panelowe); cała stylistyka siedzi w
 * src/styles/custom.css w bloku "STRONA GŁÓWNA" (klasy `gw-home-*`).
 *
 * Poniżej hero:
 *  - dla zalogowanych: ramki kategorii skonfigurowane w src/configs/home.ts
 *    (każda ramka jest w całości linkiem do podstrony, z licznikiem pozycji
 *    i opcjonalną liczbą przeterminowanych),
 *  - dla wszystkich: ramki z linkami publicznymi z plików JSON wymienionych
 *    w HOME_PUBLIC_APP_SOURCES (np. /public-apps-1.json).
 *
 * Menu boczne pojawia się dopiero na podstronach (SidebarLayout).
 */
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';
import { Icon } from '@iconify/react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import CONFIG from '@/configs/config';
import { END_TILES, HOME_INTRO, HOME_PUBLIC_APP_SOURCES, START_TILES } from '@/configs/home';
import { SECTIONS, sectionTile, sectionsWithWork } from '@/configs/sections';
import { TileCard } from '@/components/tiles/TileCard';
import { PublicAppFrames } from '@/components/home/PublicAppFrames';
import StartLayout from '@/layouts/StartLayout';

const StartPage: NextPage = () => {
  const auth = useAuth();
  const authLoading = auth?.loading !== false;
  const username = auth?.user?.username;

  // 2026-11-22: kafelki sekcji tylko tam, gdzie masz zadania lub sprawy
  // (src/configs/sections::sectionsWithWork); do odpowiedzi huba - bez kafelków sekcji.
  const [workSections, setWorkSections] = useState<{ user: string; slugs: Set<string> } | null>(null);
  useEffect(() => {
    if (authLoading || !username) return undefined;
    let cancelled = false;
    sectionsWithWork().then((slugs) => {
      if (!cancelled) setWorkSections({ user: username, slugs });
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, username]);
  const visibleSlugs = workSections && workSections.user === username ? workSections.slugs : null;
  const homeTiles = [
    ...START_TILES,
    ...SECTIONS.filter((section) => visibleSlugs?.has(section.slug)).map(sectionTile),
    ...END_TILES,
  ];

  const metaChips = [
    'Modele i zadania',
    'Regulacje i wdrożenia',
    authLoading
      ? 'Sprawdzanie sesji'
      : username
      ? `Zalogowany: ${username}`
      : 'Dostęp publiczny',
  ];

  return (
    <>
{ username ? (<></>):(
      <Head>
        <title>{`${CONFIG.app_name} — strona główna`}</title>
        <meta name="description" content={HOME_INTRO.lead} />
      </Head>
)}

      {/* Hero - przeznaczenie systemu i wejście do dashboardu */}

{ username ? (<></>):(
      <section className="gw-home-hero">
        <p className="gw-home-hero-eyebrow">{CONFIG.app_name}</p>
        <h1 className="gw-home-hero-title">{HOME_INTRO.title}</h1>
        <p className="gw-home-hero-lead">{HOME_INTRO.lead}</p>

        <ul className="gw-home-hero-meta">
          {metaChips.map((chip) => (
            <li key={chip}>{chip}</li>
          ))}
        </ul>

        <div className="gw-home-hero-actions">
          {authLoading ? (
            <span className="gw-home-button gw-home-button--ghost">
              <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
              Sprawdzanie sesji...
            </span>
          ) : username ? (
            <Link href="/home" className="gw-home-button gw-home-button--gold">
              <Icon icon="mdi:view-dashboard-outline" className="h-4 w-4" />
              Przejdź do pulpitu
            </Link>
          ) : (
            <Link
              href={`/login?returnTo=${encodeURIComponent('/home')}`}
              className="gw-home-button gw-home-button--gold"
            >
              <Icon icon="mdi:login" className="h-4 w-4" />
              Zaloguj się do dashboardu
            </Link>
          )}

          <a href="#dostep-publiczny" className="gw-home-button gw-home-button--ghost">
            <Icon icon="mdi:link-variant" className="h-4 w-4" />
            Materiały publiczne
          </a>
        </div>
      </section>
)}
      {/* Opis systemu - krótkie akapity pod hero */}
      {(HOME_INTRO.paragraphs.length > 0) && (!username)  && (
        <div className="gw-home-nota">
          {HOME_INTRO.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      {/* Kategorie (tylko po zalogowaniu) - ramki w całości linkami */}
      {!authLoading && username && (
        <section className="gw-home-section">
          <div className="gw-home-section-head">
            <h2 className="gw-home-section-title">{HOME_INTRO.tilesTitle}</h2>
{/*
            <p className="gw-home-section-note">
              Kliknięcie kafelka otwiera podstronę z menu bocznym.
            </p>
*/}
          </div>

          {homeTiles.length === 0 ? (
            <div className="gw-home-empty">
              <span className="gw-home-empty-icon">
                <Icon icon="mdi:view-dashboard-outline" className="h-5 w-5" />
              </span>
              <h3>Brak kategorii</h3>
              <p>Kafelki kategorii konfiguruje się w src/configs/home.ts, a kafelki sekcji w src/configs/sections.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {homeTiles.map((tile) => (
                <TileCard key={tile.id} tile={tile} variant="home" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Linki dostępne publicznie (z plików JSON w katalogu public/) */}
      <section className="gw-home-section" id="dostep-publiczny">
        <div className="gw-home-section-head">
          <h2 className="gw-home-section-title">{HOME_INTRO.publicFramesTitle}</h2>
{/*
          <p className="gw-home-section-note">
            Odnośniki z plików JSON (public-apps-*.json) — dostępne bez logowania.
          </p>
*/}
        </div>
        <PublicAppFrames sources={HOME_PUBLIC_APP_SOURCES} />
      </section>
    </>
  );
};

StartPage.getLayout = (page: React.ReactElement) => <StartLayout>{page}</StartLayout>;

export default StartPage;
