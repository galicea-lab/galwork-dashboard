/**
 * Typy konfiguracji stron-pulpitów (strona startowa i sekcja
 * "Regulacje i wdrożenia"). Kafelki opisują się w src/configs/home.ts oraz
 * src/configs/regulations.ts - zmiany we wdrożeniu nie wymagają dotykania
 * komponentów.
 */
import type { CountQuery } from '@/api/metrics';

/**
 * Kafelek-ramka: w całości link do podstrony, pokazuje tytuł, licznik
 * (`count`) i opcjonalnie liczbę przeterminowanych (`overdue`). Liczniki
 * tłumaczy na zapytania API `computeCount` z src/api/metrics.ts; brak klucza
 * `count`/`overdue` oznacza, że dana wartość nie jest pobierana.
 */
export interface TileConfig {
  /** Stabilny identyfikator (klucz w konfiguracji, nie w URL). */
  id: string;
  title: string;
  description?: string;
  /** Nazwa ikony Iconify, np. "mdi:gavel". */
  icon?: string;
  /** Ścieżka podstrony, na którą prowadzi cały kafelek. */
  href: string;
  /** Skąd wziąć główną liczbę na kafelku (opcjonalnie). */
  count?: CountQuery;
  /** Skąd wziąć liczbę przeterminowanych (opcjonalnie). */
  overdue?: CountQuery;
}

/** Pojedynczy link w ramce z odnośnikami publicznymi. */
export interface PublicAppLink {
  title: string;
  /** Adres absolutny (nowa karta) albo ścieżka aplikacji ("/login"). */
  url: string;
  icon?: string;
  description?: string;
}

/**
 * Zawartość pliku JSON z katalogu public/ (np. public/public-apps-1.json).
 * Dozwolona jest też sama tablica linków - format zgodny z related-apps.json.
 */
export interface PublicAppsFile {
  title?: string;
  description?: string;
  links?: PublicAppLink[];
}
