/**
 * Konfiguracja STRONY STARTOWEJ (adres "/").
 *
 * To dodatkowy modul konfiguracyjny - obok src/configs/config.ts (adresy,
 * Keycloak, znakowanie) - który opisuje treść i kafelki strony startowej.
 * Po zalogowaniu strona pokazuje ramki kategorii z `HOME_TILES`, a dla
 * niezalogowanych (i pod nimi także po zalogowaniu) ramki z linkami
 * publicznymi z plików JSON wymienionych w `HOME_PUBLIC_APP_SOURCES`.
 *
 * Każdy kafelek to cały link do podstrony; `count`/`overdue` to klucze
 * liczników z src/api/metrics.ts (opcjonalne - można je pominąć).
 *
 * UWAGA: zmiana plików JSON w public/ nie wymaga przebudowy obrazu (są to
 * pliki statyczne kopiowane do out/), ale zmiana TEGO modułu wymaga `next build`.
 */
import type { TileConfig } from '@/types/homeTiles';
import { sectionTiles } from './sections';

/** Teksty wprowadzające - opis systemu i przeznaczenia strony. */
export const HOME_INTRO = {
  title: 'Galwork — procesy, zadania i regulacje',
  lead:
    'Dashboard dla zalogowanych użytkowników: Twoje zadania, obiegi spraw, dokumenty ' +
    'i akty wewnętrzne w jednym miejscu.',
  paragraphs: [
    'Galwork prowadzi sprawy w obiegach BPMN: korespondencję, e-doręczenia, wnioski ' +
      'zakupowe, wdrożenia obiegów oraz repozytorium regulacji wewnętrznych.',
    'Bez logowania udostępniamy strony informacyjne i odnośniki publiczne. Pełny widok ' +
      'zadań, spraw i dokumentów pojawia się po zalogowaniu przez Keycloak.',
  ],
  /** Nagłówek sekcji z linkami publicznymi (pliki JSON poniżej). */
  publicFramesTitle: 'Dostępne bez logowania',
  /** Nagłówek sekcji z kafelkami kategorii (tylko po zalogowaniu). */
  tilesTitle: 'Twoje obszary pracy',
} as const;

/**
 * Kafelki-kategorie po zalogowaniu („Twoje obszary pracy”).
 *
 * 2026-11-22: kafelki sekcji (scenariuszy wdrożeniowych) powstają z
 * src/configs/sections (`sectionTiles()`) - nowa sekcja pojawia się tu sama,
 * z licznikiem Twoich zadań w jej modelach. Strona główna pokazuje kafelek
 * sekcji tylko wtedy, gdy masz w niej zadania lub sprawy (`sectionsWithWork`).
 * Ręcznie opisane są tylko kafelki
 * stron spoza konfiguracji sekcji: pulpit główny (/home) i „Regulacje i
 * wdrożenia” (/regulations, własne strony).
 */
export const START_TILES: TileConfig[] = [
  {
    id: 'modele-i-zadania',
    title: 'Modele i zadania',
    description: 'Modele obiegów, uruchomione sprawy i Twoje zadania do wykonania.',
    icon: 'mdi:email-sync-outline',
    href: '/home',
    count: { metric: 'task-count' },
    overdue: { metric: 'overdue-task-count' },
  },
];

export const END_TILES: TileConfig[] = [
  {
    id: 'regulacje-i-wdrozenia',
    title: 'Regulacje i wdrożenia',
    description: 'Akty prawne, wdrożenia obiegów w jednostkach i dokumenty spraw.',
    icon: 'mdi:gavel',
    href: '/regulations',
    // Liczba aktów w repozytorium regulacji. Dla liczby wdrożeń w mocy zmień
    // na: { metric: 'active-rollout-count' }.
    count: { metric: 'act-count' },
  },
];

/** Wszystkie kafelki (bez filtra sekcji) - kolejność na stronie głównej. */
export const HOME_TILES: TileConfig[] = [...START_TILES, ...sectionTiles(), ...END_TILES];

/**
 * Pliki JSON z linkami dostępnymi publicznie (katalog public/). Każdy plik to
 * jedna ramka; kolejność ramek = kolejność na liście. Dodanie pliku nie
 * wymaga zmian w kodzie, tylko wpisania tu jego ścieżki.
 */
export const HOME_PUBLIC_APP_SOURCES: string[] = [
  '/public-apps-1.json',
  '/public-apps-2.json',
];
