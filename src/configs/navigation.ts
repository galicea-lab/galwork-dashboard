/**
 * Menu boczne - ręczna konfiguracja nawigacji dashboardu.
 *
 * Pozycje menu są danymi, nie kodem: dodanie strony do paska bocznego to
 * dopisanie obiektu tutaj. `path` to ścieżka Next.js (bez końcowego ukośnika).
 * Dla pozycji logowania podajemy '/login' - layout sam dokleja ?returnTo=...
 */
import CONFIG from './config';
import { SECTIONS } from './sections';

export interface NavItem {
  title: string;
  path: string;
  icon: string;
}

export interface NavGroup {
  title: string;
  icon: string;
  children: NavItem[];
}

/** Menu boczne wszystkich podstron głównego dashboardu. */
export const MAIN_NAVIGATION: NavGroup[] = [
  {
    title: 'Start',
    icon: 'mdi:home-outline',
    children: [{ title: 'Strona startowa', path: '/', icon: 'mdi:home-outline' }],
  },
  {
    title: 'Workflow BPMN',
    icon: 'mdi:workflow',
    children: [
      { title: 'Pulpit główny', path: '/home', icon: 'mdi:view-dashboard' },
      { title: 'Modele procesów', path: '/process-models', icon: 'mdi:sitemap' },
      { title: 'Instancje procesów', path: '/process-instances', icon: 'mdi:progress-clock' },
      { title: 'Moje zadania', path: '/tasks', icon: 'mdi:checkbox-marked-circle-outline' },
    ],
  },
  // 2026-11-22: sekcje (scenariusze wdrożeniowe) z src/configs/sections -
  // każda ma własną podstronę i menu boczne; kolejne fazy nie zmieniają tej pozycji.
  {
    title: 'Sekcje',
    icon: 'mdi:view-grid-outline',
    children: SECTIONS.map((section) => ({
      title: section.title,
      path: `/${section.slug}`,
      icon: section.icon,
    })),
  },
  {
    title: 'Zakupy',
    icon: 'mdi:cart-outline',
    children: [
      { title: 'Wnioski zakupowe', path: '/purchase-requests', icon: 'mdi:cart-outline' },
    ],
  },
  {
    title: 'Regulacje i wdrożenia',
    icon: 'mdi:gavel',
    children: [
      {
        title: 'Pulpit regulacji',
        path: '/regulations',
        icon: 'mdi:view-dashboard-outline',
      },
    ],
  },
  {
    title: 'Komunikacja & Narzędzia',
    icon: 'mdi:calendar-multiselect',
    children: [
      { title: 'Zdarzenia i terminy', path: '/events', icon: 'mdi:calendar-clock' },
      { title: 'Powiadomienia', path: '/notifications', icon: 'mdi:bell-outline' },
    ],
  },
  {
    title: 'Konto',
    icon: 'mdi:account',
    children: [{ title: 'Logowanie / Profil', path: '/login', icon: 'mdi:login' }],
  },
];

/**
 * Menu boczne sekcji "Regulacje i wdrożenia" (strony /regulations/*).
 * Sekcja ma własny pasek boczny - dlatego na jej stronach nie widać menu
 * głównego dashboardu, tylko pozycje związane z aktami, wdrożeniami obiegów
 * i dokumentami spraw.
 */
export const REGULATIONS_NAVIGATION: NavGroup[] = [
  {
    title: 'Regulacje i wdrożenia',
    icon: 'mdi:gavel',
    children: [
      {
        title: 'Pulpit regulacji',
        path: '/regulations',
        icon: 'mdi:view-dashboard-outline',
      },
      { title: 'Akty prawne', path: '/regulations/acts', icon: 'mdi:book-law' },
      {
        title: 'Wdrożenia obiegów',
        path: '/regulations/rollouts',
        icon: 'mdi:rocket-launch-outline',
      },
    ],
  },
  {
    title: 'Obiegi i sprawy',
    icon: 'mdi:sitemap',
    children: [
      { title: 'Modele obiegów', path: '/process-models', icon: 'mdi:sitemap' },
      { title: 'Instancje i dokumenty', path: '/process-instances', icon: 'mdi:progress-clock' },
      { title: 'Moje zadania', path: '/tasks', icon: 'mdi:checkbox-marked-circle-outline' },
    ],
  },
  {
    title: 'Start',
    icon: 'mdi:home-outline',
    children: [{ title: 'Strona startowa', path: '/', icon: 'mdi:home-outline' }],
  },
];

/**
 * Tytuł wyświetlany w nagłówku strony dla danej ścieżki: dokładne dopasowanie
 * pozycji menu, a dla podstron (np. /tasks/123) - najdłuższy pasujący prefiks.
 */
export function findNavTitle(navigation: NavGroup[], pathname: string): string {
  const items = navigation.flatMap((group) => group.children);
  const exact = items.find((item) => item.path === pathname);
  if (exact) return exact.title;
  const prefixed = items
    .filter((item) => item.path !== '/' && pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefixed?.title ?? CONFIG.app_name;
}

/** Czy pozycja menu odpowiada bieżącej ścieżce (bez fałszywych trafień '/'). */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === '/') return pathname === '/';
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}
