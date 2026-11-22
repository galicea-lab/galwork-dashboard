/**
 * GLOBALNA konfiguracja wdrożenia dashboardu.
 *
 * To jest jedyne miejsce, w którym ustawia się adres Keycloaka, API backendu
 * (galwork-hub) oraz teksty znakowania widoczne w nagłówku/stopce. Wszystkie
 * moduły aplikacji (logowanie, klient API, layouty) czytają wartości wyłącznie
 * stąd - nie duplikuj ich w komponentach.
 *
 * UWAGA: build jest statyczny (`output: 'export'`, zob. next.config.js), więc
 * `process.env.NEXT_PUBLIC_*` jest wklejane na trwałe do bundla w czasie
 * `next build` - zmiana tych zmiennych wymaga ponownego zbudowania obrazu.
 * Adresy, które mają być zmieniane bez przebudowy, trzymaj w plikach JSON z
 * katalogu `public/` (zob. README.md, sekcja "Strona startowa").
 *
 * Wartości domyślne poniżej to środowisko deweloperskie. Puste `api_url`
 * oznacza wywołania względne ('/v1/wf' - zob. src/api/client.ts) - używane w
 * produkcji, gdy nginx tego kontenera proxuje /v1/ do galwork-hub.
 */
export type Config = {
  /** URL realm Keycloaka, np. "https://login.example.com/realms/galwork". */
  keycloak: string;
  /** Client ID (publiczny klient OIDC z PKCE) w tym realmie. */
  keycloak_client: string;
  /**
   * Baza API galwork-hub. Pusty string = żądania względne ('/v1/wf' - ten
   * sam host co frontend, np. gdy nginx proxuje /v1/ do huba).
   */
  api_url: string;
  /** Nazwa systemu - nagłówek, tytuł strony, stopka. */
  app_name: string;
  /** Wersja aplikacji prezentowana w stopce; trzymaj zgodną z package.json. */
  app_version: string;
  /** Tekst stopki (np. właściciel systemu, kontakt). */
  footer_text: string;
};

const CONFIG: Config = {
  keycloak:
    process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'https://login.e-talar.com/realms/galwork',
  keycloak_client: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT || 'transmem',
  api_url: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8086/v1/wf/',
  app_name: process.env.NEXT_PUBLIC_APP_NAME || 'Galwork Dashboard',
  app_version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.4',
  footer_text: process.env.NEXT_PUBLIC_FOOTER_TEXT || '© 2026 Galwork — procesy, zadania i regulacje',
};

export default CONFIG;
