Projekt: Galwork
Aplikacja: Galwork-Dashboard

Zastosowanie: frontend - procesy i zadania użytkowników Galwork

Wersja beta v0.1.4

Wymaga galwork-hub (BFF) w wersji min. v0.1.4

Dokumentacja: https://galwork.net

---

# Galwork Dashboard — konfiguracja wdrożenia

Aplikacja to statyczny eksport Next.js (`output: 'export'`, zob. `next.config.js`),
serwowany przez nginx, który ten sam kontener używa też jako proxy do
`galwork-hub` (`/v1/`). Z tego wynikają dwie zasady wdrożeniowe:

1. **Konfiguracja infrastrukturalna** (Keycloak, adres API, teksty znakowania)
   wchodzi do bundla w czasie `next build` — zmiana wymaga przebudowania obrazu.
2. **Treść i wygląd** (linki publiczne, wygląd strony) można zmieniać bez
   przebudowy — to pliki `public/*.json` i zmienne CSS w
   `src/styles/custom.css` (wymagają tylko podmiany plików w obrazie/kontenerze).

## 1. Adresy stron

| Adres | Zawartość | Menu boczne |
| --- | --- | --- |
| `/` | strona główna (publiczna): opis systemu + ramki publiczne (JSON), po zalogowaniu także ramki kategorii; styl wg galwork-www | **nie** |
| `/home` | pulpit główny („Modele i zadania”): widgety z zadaniami i sprawami | tak |
| `/tasks`, `/process-instances`, `/process-models`, `/purchase-requests`, `/events`, `/notifications`, `/calendar` | podstrony dashboardu | tak |
| `/regulations` | sekcja „Regulacje i wdrożenia” — pulpit sekcji | tak (własne menu) |
| `/regulations/acts` | akty prawne — wyszukiwarka + status prawny aktu | tak (własne menu) |
| `/regulations/rollouts` | rejestr wdrożeń obiegów w jednostkach | tak (własne menu) |
| `/zakupy`, `/zakupy/faktury`, `/zakupy/zestawienia/*`, `/zakupy/zadania` | sekcja „Zakupy i umowy” (ZAK.1) — obieg faktur z ERPNext | tak (menu sekcji) |
| `/it`, `/it/systemy`, `/it/domeny`, `/it/zestawienia/*`, `/it/zadania` | sekcja „Informatyka” (IT.1) — strony z konfiguracji `src/configs/sections` (zob. 5a) | tak (menu sekcji) |
| `/login` | logowanie przez Keycloak (PKCE) — bez menu bocznego | **nie** |

Menu boczne pojawia się dopiero na podstronach (`src/layouts/SidebarLayout.tsx`).
Bez paska bocznego działają: strona startowa (`src/layouts/StartLayout.tsx`)
oraz ekran logowania (`src/layouts/AuthLayout.tsx`).

## 2. `src/configs/config.ts` — globalna konfiguracja wdrożenia

**To jedyne miejsce, w którym ustawia się adresy i znakowanie.** Czytają je:
`AuthProvider` (`_app.tsx`), strona logowania, klient API (`api/client.ts`),
nagłówek, stopka i paski boczne. Nie kopiuj tych wartości w komponentach.

```ts
const CONFIG: Config = {
  keycloak:        'https://login.example.com/realms/galwork', // realm Keycloaka
  keycloak_client: 'galwork-dashboard',                        // client_id (publiczny, PKCE)
  api_url:         '',                                         // '' = względne /v1/wf (zalecane)
  app_name:        'Galwork Dashboard',
  app_version:     '0.1.4',
  footer_text:     '© 2026 Galwork — procesy, zadania i regulacje',
};
```

Każde pole można też ustawić zmienną środowiskową w czasie budowania obrazu
(wartości są wklejane do statycznego bundla):

| Pole | Zmienna | Domyślnie (`config.ts`) |
| --- | --- | --- |
| `keycloak` | `NEXT_PUBLIC_KEYCLOAK_URL` | `https://login.e-talar.com/realms/galwork` |
| `keycloak_client` | `NEXT_PUBLIC_KEYCLOAK_CLIENT` | `transmem` |
| `api_url` | `NEXT_PUBLIC_API_URL` | `http://localhost:8086/v1/wf/` (dev) |
| `app_name` | `NEXT_PUBLIC_APP_NAME` | `Galwork Dashboard` |
| `app_version` | `NEXT_PUBLIC_APP_VERSION` | `0.1.4` (trzymaj zgodną z `package.json`) |
| `footer_text` | `NEXT_PUBLIC_FOOTER_TEXT` | `© 2026 Galwork — ...` |

`api_url`:

* pusty (lub `''`) — aplikacja woła `/v1/wf/...` na **tym samym originie**, a
  nginx tego kontenera proxuje `/v1/` do `galwork-hub` (zmienna `HUB_UPSTREAM`
  szablonu `nginx/default.conf.template`). To wariant zalecany w produkcji —
  brak CORS i jeden adres publiczny.
* pełny adres (np. `https://galwork.example.com/v1/wf/`) — frontend woła hub
  bezpośrednio; wtedy hub musi mieć skonfigurowany CORS dla originu dashboardu.

## 3. Konfiguracja Keycloak (logowanie)

Frontend loguje się przez **Authorization Code + PKCE** (biblioteka
`@galicea-lab/nextjs-keycloak-auth`) — nie ma backendu sesji, wszystko dzieje się
w przeglądarce.

### 3.1. Klient OIDC w Keycloaku

W realmie podanym w `CONFIG.keycloak` utwórz klienta o `Client ID` =
`CONFIG.keycloak_client`:

* **Client authentication:** OFF (klient publiczny — SPA nie może trzymać sekretu),
* **Standard flow:** ON (Authorization Code), Implicit/Direct grants: OFF,
* **Valid redirect URIs:** `https://<adres-dashboardu>/login`
  (biblioteka ustawia `redirect_uri = window.location.origin + '/login'`).
  Dla wygody w środowisku testowym można dodać `https://<adres-dashboardu>/*`
  oraz `http://localhost:3000/login` dla pracy lokalnej (`next dev`),
* **Web origins:** `https://<adres-dashboardu>` (albo `+`) — endpoint tokenu
  jest wywoływany z przeglądarki, więc CORS musi działać,
* **PKCE:** włączone (metoda `S256`).
* **Post logout redirect URIs:** nie są potrzebne — przycisk „Wyloguj” czyści
  tokeny w przeglądarce i nie wywołuje endpointu end-session Keycloaka (sesja
  SSO w Keycloaku pozostaje; kolejne logowanie może być wtedy „ciche”).
* Zakresy/claims: biblioteka nie przekazuje parametru `scope` w żądaniu
  autoryzacji — działają **domyślne client scopes** klienta. Zostaw w nich
  `openid`, `profile` i `email` (z `email` nagłówek pokazuje adres; bez niego
  wyświetla się `preferred_username`). Jeśli używasz grup Keycloaka, dodaj
  mappers → `groups` (Group Membership), żeby claim trafił do tokenu.

### 3.2. Role i uprawnienia

* Administrator procesów: rola `galwork-admin` (`ADMIN_ROLE` w
  `src/hooks/useIsAdmin.ts`). Może to być rola realmowa **albo** rola klienta
  `keycloak_client` — biblioteka scala `realm_access.roles` i
  `resource_access[<client>].roles`.
* Rola w Keycloaku tylko pokazuje/ukrywa elementy UI. **Realne sprawdzenie
  uprawnień jest po stronie `galwork-hub`** — m.in. `[keycloak] admin_groups` w
  `config/config.ini` huba oraz członkostwo w sprawach repozytorium
  (`instance_print.can_print`) dla aktów i dokumentów.

### 3.3. Przebieg logowania

1. Użytkownik wchodzi na `/login` (lub klika „Zaloguj” w nagłówku).
2. Biblioteka zapamiętuje bieżącą ścieżkę (`?returnTo=/tasks`), przekierowuje do
   Keycloaka i po powrocie wraca na zapamiętaną stronę (domyślnie `/`).
3. Token access jest przepisywany do klienta API (`useSyncAuthToken`) i doklejany
   jako `Authorization: Bearer ...` do każdego żądania `/v1/wf/...`.
4. Odświeżanie tokenu odbywa się automatycznie (refresh token trzymany w
   `localStorage` biblioteki); „Wyloguj” czyści tokeny w przeglądarce i wraca
   do widoku dla niezalogowanych (bez kończenia sesji SSO w Keycloaku).

## 4. Strona startowa (`/`) — `src/configs/home.ts`

Strona startowa nie ma paska bocznego. Zawiera opis systemu (`HOME_INTRO`) i:

* dla **niezalogowanych**: ramki z linkami publicznymi z plików JSON z katalogu
  `public/` (lista w `HOME_PUBLIC_APP_SOURCES`),
* dla **zalogowanych**: ramki kategorii z `HOME_TILES` (każda ramka jest
  w całości linkiem do podstrony, pokazuje tytuł, licznik i opcjonalnie liczbę
  przeterminowanych), a pod nimi tak samo ramki publiczne.

### 4.1. Kafelki kategorii (`HOME_TILES`)

```ts
{
  id: 'modele-i-zadania',
  title: 'Modele i zadania',
  description: 'Modele obiegów, uruchomione sprawy i Twoje zadania do wykonania.',
  icon: 'mdi:email-sync-outline',        // nazwa ikony Iconify
  href: '/home',                         // cała ramka prowadzi tutaj
  count:   { metric: 'task-count' },     // licznik główny (opcjonalny)
  overdue: { metric: 'overdue-task-count' }, // liczba przeterminowanych (opcjonalna)
}
```

Dodanie kategorii = dopisanie kolejnego obiektu z unikalnym `id`. Kolejność w
tablicy = kolejność ramek.

<!-- 2026-11-22: kafelki sekcji z src/configs/sections -->
`HOME_TILES` = `START_TILES` (pulpit główny) + **kafelki sekcji** + `END_TILES`
(„Regulacje i wdrożenia”). Kafelki sekcji powstają z `src/configs/sections`
(`sectionTiles()`): tytuł, ikona, `summary` sekcji, link do `/<sekcja>`,
licznik Twoich zadań w modelach sekcji i zadań po terminie. Nowa sekcja w
konfiguracji pojawia się na stronie głównej bez zmian w `home.ts` – ale tylko
użytkownikom, którzy mają w niej otwarte zadania albo widzą choć jedną sprawę
jej modeli (`sectionsWithWork()`; lista spraw huba pokazuje tylko sprawy
widoczne dla użytkownika). Kafelki stałe są widoczne zawsze.

### 4.2. Klucze liczników (`metric`)

Liczniki tłumaczy na zapytania API `computeCount` w `src/api/metrics.ts` — jedyne
miejsce, w którym zmienia się ich definicję:

| `metric` | Co pokazuje | Zapytanie |
| --- | --- | --- |
| `task-count` | liczba Twoich zadań (opcjonalnie tylko w `processModelKeys`) | `GET /tasks/my?limit=1` (`total`) |
| `overdue-task-count` | Twoje zadania po terminie | `GET /tasks/my?overdue=true` |
| `process-count` | instancje procesów w stanie `status` (`running`, `waiting`, …) | `GET /process-instances?limit=1` |
| `notification-count` | nieprzeczytane powiadomienia | `GET /notifications` |
| `act-count` | akty w repozytorium regulacji | `GET /acts?limit=500` |
| `active-rollout-count` | wdrożenia obiegów obowiązujące dziś | `GET /process-rollouts?active_on=<dziś>` |

`processModelKeys` zawęża licznik zadań do wybranych obiegów, np.
`{ metric: 'task-count', processModelKeys: ['pisma-przychodzace'] }`.

### 4.3. Ramki publiczne (`public/public-apps-*.json`)

Każdy plik to jedna ramka. Można go zmienić/podmienić w kontenerze bez
przebudowy aplikacji (`/usr/share/nginx/html/public-apps-1.json`). Format:

```json
{
  "title": "System Galwork",
  "description": "Informacje o systemie dostępne bez logowania",
  "links": [
    {
      "title": "Strona informacyjna",
      "url": "https://galwork.net",
      "icon": "mdi:web",
      "description": "Opis systemu i kontakt"
    },
    {
      "title": "Zaloguj się",
      "url": "/login",
      "icon": "mdi:login",
      "description": "Przejście do logowania"
    }
  ]
}
```

* `url` zaczynający się od `/` = strona aplikacji (nawigacja wewnętrzna),
* `url` z `http(s)://` = link zewnętrzny (nowa karta),
* dozwolona jest też sama tablica linków (format zgodny z
  `public/related-apps.json`),
* brak `title` → nazwa ramki powstaje z nazwy pliku (np. „Public apps 1”),
* nowy plik wystarczy dodać do `HOME_PUBLIC_APP_SOURCES` (to już wymaga
  przebudowy, bo lista jest w bundlu).

## 5. Sekcja „Regulacje i wdrożenia” (`/regulations`)

Sekcja ma **własne menu boczne** (`REGULATIONS_NAVIGATION`) i własne kafelki
(`REGULATIONS_TILES`) w `src/configs/regulations.ts` — analogicznie do strony
startowej (te same pola `count`/`overdue`/`href`). Zawiera:

* **Akty prawne** (`/regulations/acts`) — wyszukiwarka `GET /acts?q=`, status
  prawny aktu na wybrany dzień (`GET /acts/{id}?on=`) w oknie modalnym,
  podgląd/pobranie redakcji przez `GET /acts/{id}/content` oraz dodawanie aktu
  (S2.2.A) z modalu albo pełnej strony `/regulations/acts/new`: start obiegu
  `dokumenty`, wgranie PDF z rolą `main` i przejście do sprawy,
* **Wdrożenia obiegów** (`/regulations/rollouts`) — rejestr `GET
  /process-rollouts` (tryb testowy/pomocniczy/produkcyjny, jednostki, okres,
  akt, z którego powstało wdrożenie),
* skróty do modeli obiegów, instancji z dokumentami i dyskusjami oraz zadań.

„Dodaj akt” zapisuje dane przez istniejące API generyczne: `POST
/process-instances` dla modelu `dokumenty`, upload pliku z rolą `main` oraz
`POST /process-instances/{id}/wake`. Pozostałe widoki sekcji pozostają tylko do
odczytu; wdrożenia powstają z aktu w obiegach BPMN, a dokumenty/dyskusje należą
do sprawy instancji. Przycisk jest widoczny na podstawie
`GET /v1/wf/me/permissions` (`can_create_act`), więc nie zależy wyłącznie od roli
`galwork-admin`. Galwork-hub egzekwuje ten sam warunek, zwracając 403 przy
starcie obiegu `dokumenty`.

Data „Obowiązuje od” jest wymagana w formularzu startowym modelu `dokumenty`
(`x-required-in-steps: ["Start"]` w `dokumenty-uz-schema.json`). Hub odrzuca start
bez niej (422) zanim powstanie sprawa, więc dashboard nie ma osobnej walidacji
ani panelu naprawy danych.

<!-- 2026-11-21: rezygnacja z pieczęci i podgląd redakcji w statusie aktu. -->
Formularz startowy ma pole „Czy opieczętować elektronicznie?” (domyślnie
zaznaczone). Odznaczenie pomija krok `pieczec.dokument` tylko dla tej sprawy;
zaznaczenie nadal wymaga skonfigurowanego podpisu elektronicznego. W modalu
statusu aktu przyciski „Otwórz PDF”/„Pobierz PDF” używają
`GET /acts/{document_id}/content`: bez `version_no` hub wybiera redakcję
obowiązującą w dniu `on`, a przyciski w tabeli redakcji pobierają wskazaną
wersję z historii.

<!-- 2026-11-22: sekcje z konfiguracji (scenariusz wdrożeniowy = sekcja, faza = przyrost) -->
## 5a. Sekcje rejestrów (`/<sekcja>`) — `src/configs/sections/`

Sekcja to podstrona jednego obszaru (scenariusz wdrożeniowy, np. `IT`), wdrażana
fazami (`IT.1`, `IT.2`…). Strony są wspólne dla wszystkich sekcji
(`src/pages/[section]/**`), a treść pochodzi z konfiguracji
`src/configs/sections/<sekcja>.ts` (`SectionConfig`). Przepis:
`galwork-dev-jw/wdrozenia/galicea/custom_dashboard2.md`.

| Strona | Zawartość | API galwork-hub |
|---|---|---|
| `/<sekcja>` | pulpit: opis, kafelki rejestrów i słowników z licznikami, zestawienia | `GET /process-instances?process_model_key=&status=` |
| `/<sekcja>/<rejestr>` | lista: kolumny z `metadata_extraction_paths` modelu, wyszukiwanie, filtry z enum i pól tak/nie, sortowanie, eksport CSV | `GET /process-models/{key}/metadata-fields`, `GET /process-instances?q=&m.<klucz>=&sort=` |
| `/<sekcja>/<rejestr>/nowy` | formularz startowy modelu, po zapisie karta | `GET /process-models/{key}/start-form`, `POST /process-instances` |
| `/<sekcja>/<rejestr>/karta?id=` | karta: dane według formularza kroku `galwork.record_step` tylko do odczytu; „Edytuj” (zadanie `galwork.edit_step`), „Przebieg sprawy”, wydruki | `GET /process-instances/{id}/record` |
| `/<sekcja>/zestawienia/<id>` | lista z ustalonym filtrem, sortowaniem i kolumnami | jak lista |
| `/<sekcja>/zadania` | moje zadania w modelach sekcji | `GET /tasks/my` |

Sekcja pojawia się w menu głównym w grupie „Sekcje” i ma własne menu boczne
(pulpit, rejestry, słowniki, zestawienia, zadania). Ścieżki są generowane przy
budowie (`getStaticPaths`), więc nowy rejestr albo zestawienie wymaga wpisu w
konfiguracji i przebudowy — bez nowych stron. Nazwy pól, kolumny, karta i
uprawnienia pochodzą z modelu w `galwork-models`; listy i karty pokazują tylko
sprawy widoczne dla użytkownika (filtr dostępu huba).

Wdrożone sekcje: `it` (faza IT.1 — rejestr `rejestr-systemow`, słownik `domeny`), `zakupy` (faza ZAK.1 — rejestr `faktura-zakupu`; sprawy zakłada hub na informację o fakturze z ERPNext, więc bez przycisku dodawania).

## 6. Menu boczne — `src/configs/navigation.ts`

* `MAIN_NAVIGATION` — menu głównego dashboardu (używane przez `TailwindLayout`),
* `REGULATIONS_NAVIGATION` — menu sekcji regulacji (`SectionLayout`).

Pozycja to `{ title, path, icon }`. `path` = trasa Next.js; dla pozycji
logowania wpisz `/login` (layout sam dokleja `?returnTo=`). Podświetlanie
aktywnej pozycji obsługuje `isNavItemActive` (bez fałszywych trafień dla `/`).

## 7. Wygląd strony — `src/styles/custom.css`

Plik jest ładowany **po** Tailwandzie (`src/pages/_app.tsx`), więc nadpisuje
klasy. Cały wygląd sprowadza się do zmiennych CSS w `:root` — edycja nie wymaga
znajomości Tailwinda. Najważniejsze:

```css
:root {
  --gw-brand: #2563eb;             /* kolor akcentu: przyciski, aktywne menu */
  --gw-sidebar-bg: #020617;        /* tło paska bocznego */
  --gw-sidebar-text: #e2e8f0;      /* tekst pozycji menu */
  --gw-sidebar-active-bg: #2563eb; /* tło aktywnej pozycji */
  --gw-header-bg: #ffffff;         /* tło nagłówka */
  --gw-header-text: #1e293b;       /* tekst nagłówka */
  --gw-footer-bg: #020617;         /* tło stopki */
  --gw-footer-text: #cbd5e1;       /* tekst stopki */
  --gw-page-bg: #f8fafc;           /* tło strony */
  --gw-card-bg: #ffffff;           /* tło kafelków/ramek */
  --gw-card-border: #e2e8f0;
  --gw-card-radius: 0.75rem;
  --gw-sidebar-width: 16rem;       /* szerokość paska bocznego */
}
```

Publiczna strona główna (`/`) i ekran logowania mają własny, spójny z
[galwork-www](https://galwork.net) zestaw zmiennych `--gw-home-*` (blok
„STRONA GŁÓWNA” w `custom.css`): granat `--gw-home-marka-*`, złoto
`--gw-home-akcent-*`, `--gw-home-panel`, `--gw-home-linia`, `--gw-home-cien`,
wymiary `--gw-home-promien*` oraz ciemny pasek nagłówka (`.gw-header--brand`).
Te wartości dotyczą **wyłącznie strony głównej** — pulpit (`/home`) i pozostałe
podstrony korzystają z globalnych `--gw-*` i pozostają bez zmian.

Przykłady zmian przy wdrożeniu (np. branding instytucji):

* jasny pasek boczny: `--gw-sidebar-bg: #ffffff; --gw-sidebar-text: #1e293b;
  --gw-sidebar-active-bg: #0f766e; --gw-brand: #0f766e;`
* nagłówek w kolorze marki: `--gw-header-bg: #0f766e; --gw-header-text: #ffffff;`
* stopka biała z ciemnym tekstem: `--gw-footer-bg: #ffffff;
  --gw-footer-text: #334155;`
* strona główna w innym kolorze marki: `--gw-home-marka-900: #0f3d3e;
  --gw-home-marka-950: #06292a; --gw-home-akcent-400: #d4a017;`

Teksty znakowania (nazwa systemu, wersja, stopka) ustawia się w `CONFIG`
(sekcja 2), a nie w CSS.

## 8. Uruchomienie lokalne

```bash
cd galwork-dashboard
yarn            # albo npm install
npm run dev     # http://localhost:3000
```

Plik `.env` (lokalny, poza repozytorium) ustawia adres huba, np.
`NEXT_PUBLIC_API_URL=http://localhost:8086/v1/wf/`. Dla pracy bez Keycloaka
można tymczasowo wskazać inny realm w `CONFIG.keycloak`, pamiętając o
`Valid redirect URIs` = `http://localhost:3000/login`.

## 9. Budowanie i wdrożenie

```bash
npm run build                 # statyczny eksport do out/
npm run check:ai              # walidacja znaczników AI w komentarzach
npx eslint "src/**/*.{js,jsx,ts,tsx}"
npx tsc --noEmit
```

Obraz produkcyjny (`Dockerfile`) buduje eksport i serwuje go z nginx:

```bash
docker build -f galwork-dashboard/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL="" \
  --build-arg NEXT_PUBLIC_KEYCLOAK_URL="https://login.example.com/realms/galwork" \
  --build-arg NEXT_PUBLIC_KEYCLOAK_CLIENT="galwork-dashboard" \
  --build-arg NEXT_PUBLIC_APP_NAME="Galwork Dashboard" \
  --build-arg NEXT_PUBLIC_APP_VERSION="0.1.4" \
  --build-arg NEXT_PUBLIC_FOOTER_TEXT="© 2026 ..." \
  -t galwork-dashboard .
```

W runtime liczy się tylko jedna zmienna szablonu nginx: **`HUB_UPSTREAM`**
(adres `galwork-hub`, np. `http://galwork-hub:8080`) — z niej powstaje proxy
`/v1/`. Pusta `NEXT_PUBLIC_API_URL` jest wtedy wymagana, żeby frontend korzystał
z tego proxy.

### Lista kontrolna wdrożenia

1. `CONFIG` (lub build-argi): adres realmu, `client_id`, `api_url` (puste przy
   proxy nginx), nazwa/stopka.
2. Keycloak: klient publiczny z PKCE, `Valid redirect URIs` = `<origin>/login`,
   `Web origins` = origin dashboardu, rola `galwork-admin` (jeśli potrzebna).
3. `HUB_UPSTREAM` w nginx; hub dostępny pod `/v1/` z przeglądarki.
4. `custom.css`: kolory marki (opcjonalnie).
5. `public/public-apps-*.json`: linki publiczne na stronie startowej.
6. `src/configs/home.ts` / `src/configs/regulations.ts`: kafelki, liczniki.
7. **Polityka prywatności**: wdrożenie wymaga własnej polityki dopasowanej do
   jednostki. Strona informacyjna (`galwork-www`) zawiera tylko ogólny szablon
   (`polityka-prywatnosci.html`, administrator: Fundacja Galicea, dane:
   logowanie i rozliczenia deweloperów) — trzeba ją zastąpić własną polityką
   i podmienić odnośnik: `link-polityka-prywatnosci` w `galwork-www/index.html`
   oraz adres w `public/public-apps-2.json` (kafelek „Polityka prywatności” na
   stronie głównej dashboardu). Zob. `galwork-www/README.md`, sekcja
   „Polityka prywatności”.
8. Weryfikacja po wdrożeniu: `/` (opis + ramki publiczne), logowanie, `/home`
   (liczniki zadań), `/regulations` (akty i wdrożenia).

## 10. Uwagi techniczne

* Aplikacja jest **statyczna** — nie ma dynamicznych tras generowanych w
  runtime; nowa strona = nowy plik w `src/pages` + `npm run build`.
* Liczniki są pobierane po stronie przeglądarki (po zalogowaniu) i pokazują
  `…`, dopóki odpowiedź nie wróci; błąd pobrania nie blokuje reszty strony.
* `act-count` liczy maksymalnie 500 aktów (`GET /acts?limit=500`) — dla
  większego repozytorium trzeba dodać licznik po stronie huba.
* Treść plików `public/*.json` czytana jest w locie (`cache: 'no-store'`), więc
  podmiana pliku w kontenerze działa bez restartu przeglądarki po odświeżeniu.
* Uprawnienia: UI tylko ukrywa funkcje administracyjne; każde żądanie weryfikuje
  `galwork-hub` (role/grupy Keycloaka i członkostwo w sprawie).
