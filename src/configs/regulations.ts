/**
 * Konfiguracja sekcji "REGULACJE I WDROŻENIA" (/regulations).
 *
 * Sekcja jest odpowiednikiem pulpitu głównego, ale dla obszaru regulacji:
 * akty prawne (repozytorium aktów), wdrożenia obiegów w jednostkach
 * organizacyjnych, dokumenty spraw i dyskusje. Kafelki opisane są danymi -
 * tak jak na stronie startowej (src/configs/home.ts) - a menu boczne sekcji
 * znajduje się w src/configs/navigation.ts (REGULATIONS_NAVIGATION).
 *
 * 2026-11-21: kafelek „Akty prawne” informuje o szybkim dodawaniu aktu.
 *
 * Liczniki (`count`/`overdue`) to klucze z src/api/metrics.ts, m.in.:
 *  - `act-count`            - akty w repozytorium (GET /acts),
 *  - `active-rollout-count` - wdrożenia obowiązujące dziś (GET /process-rollouts).
 */
import type { TileConfig } from '@/types/homeTiles';

export const REGULATIONS_INTRO = {
  title: 'Regulacje i wdrożenia',
  lead:
    'Repozytorium aktów wewnętrznych, rejestr wdrożeń obiegów w jednostkach ' +
    'organizacyjnych oraz sprawy z dokumentami i dyskusjami.',
  paragraphs: [
    'Wdrożenia obiegów powstają wyłącznie z aktu prawnego (krok "Wdrożenie obiegów"), ' +
      'więc rejestr pokazuje, na podstawie którego aktu obieg jest używany - w trybie ' +
      'testowym, pomocniczym albo produkcyjnym.',
    'Treść aktu oraz dokumenty sprawy pobierane są przez sprawę w repozytorium - ' +
      'uprawnienia sprawdza galwork-hub.',
  ],
  tilesTitle: 'Obszary sekcji',
  latestRolloutsTitle: 'Najnowsze wdrożenia obiegów',
  latestInstancesTitle: 'Ostatnie sprawy',
} as const;

export const REGULATIONS_TILES: TileConfig[] = [
  {
    id: 'akty-prawne',
    title: 'Akty prawne',
    description: 'Akty w repozytorium regulacji - status prawny i szybkie dodanie aktu.',
    icon: 'mdi:book-law',
    href: '/regulations/acts',
    count: { metric: 'act-count' },
  },
  {
    id: 'wdrozenia-obiegow',
    title: 'Wdrożenia obiegów',
    description: 'Obiegi w użyciu w jednostkach organizacyjnych - tryb i okres wdrożenia.',
    icon: 'mdi:rocket-launch-outline',
    href: '/regulations/rollouts',
    count: { metric: 'active-rollout-count' },
  },
  {
    id: 'obiegi-w-toku',
    title: 'Obiegi w toku',
    description: 'Uruchomione instancje procesów wraz z dokumentami i dyskusjami.',
    icon: 'mdi:progress-clock',
    href: '/process-instances',
    count: { metric: 'process-count', status: 'running' },
  },
  {
    id: 'moje-zadania',
    title: 'Moje zadania',
    description: 'Twoje zadania w obiegach, w tym te po terminie.',
    icon: 'mdi:checkbox-marked-circle-outline',
    href: '/tasks',
    count: { metric: 'task-count' },
    overdue: { metric: 'overdue-task-count' },
  },
];
