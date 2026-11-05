import type { DashboardLayout } from '@/types/dashboardConfig';

/**
 * Domyślny układ pulpitu - to, co dziś gra rolę "konfiguracji przez
 * administratora": nowy użytkownik (brak zapisanego układu w localStorage,
 * zob. ./storage.ts) dostaje ten zestaw, a dalej personalizuje go u siebie.
 *
 * Identyfikatory widgetów są na sztywno (nie generowane w locie), żeby ten
 * moduł dawał identyczny wynik po stronie serwera i klienta (Next.js SSR) -
 * losowe id w module ewaluowanym dwa razy skończyłoby się niezgodnością przy
 * hydracji.
 *
 * `pisma-przychodzace` i `powiadomienia-e-dorczen` to klucze procesów
 * faktycznie zdefiniowanych w spiffworkflow/kancelaria (zob. galwork-arena).
 * Żeby dodać tu kafelek dla innego obiegu (np. akceptacji faktur zakupu,
 * gdy taki proces powstanie) - wystarczy dopisać widget tego samego typu
 * `task-queue`/`process-list` z jego `processModelKeys`, bez zmian w kodzie.
 */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  version: 1,
  widgets: [
    {
      id: 'default-overdue-kpi',
      type: 'kpi',
      title: 'Przeterminowane zadania',
      icon: 'mdi:clock-alert-outline',
      size: 'sm',
      metric: 'overdue-task-count',
      href: '/tasks',
    },
    {
      id: 'default-notifications-kpi',
      type: 'kpi',
      title: 'Nieprzeczytane powiadomienia',
      icon: 'mdi:bell-outline',
      size: 'sm',
      metric: 'notification-count',
      href: '/notifications',
    },
    {
      id: 'default-correspondence-kpi',
      type: 'kpi',
      title: 'Nowa korespondencja',
      icon: 'mdi:email-arrow-left-outline',
      size: 'sm',
      metric: 'task-count',
      processModelKeys: ['pisma-przychodzace', 'powiadomienia-e-dorczen'],
      href: '/tasks',
    },
    {
      id: 'default-my-tasks',
      type: 'task-queue',
      title: 'Moje zadania',
      icon: 'mdi:format-list-checks',
      size: 'md',
      limit: 5,
    },
    {
      id: 'default-correspondence-queue',
      type: 'task-queue',
      title: 'Korespondencja do przejrzenia',
      icon: 'mdi:email-outline',
      size: 'md',
      processModelKeys: ['pisma-przychodzace', 'powiadomienia-e-dorczen'],
      limit: 5,
    },
    {
      id: 'default-start-shortcut',
      type: 'shortcut',
      title: 'Uruchom proces',
      description: 'Wybierz model procesu i wystartuj nową instancję.',
      icon: 'mdi:play-circle-outline',
      size: 'sm',
      href: '/process-models',
    },
   {
      id: 'default-related-apps',
      type: 'related-apps',
      title: 'Aplikacje powiązane',
      icon: 'mdi:apps',
      size: 'sm',
    },
  ],
};
