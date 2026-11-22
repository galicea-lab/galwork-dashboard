/**
 * Layout podstron z paskiem bocznym.
 *
 * Ten sam komponent obsługuje menu główne dashboardu (TailwindLayout) i menu
 * sekcji "Regulacje i wdrożenia" (SectionLayout) - różnią się wyłącznie listą
 * pozycji przekazaną w `navigation` (zob. src/configs/navigation.ts).
 *
 * Responsywność: od breakpointu `lg` (1024 px) pasek boczny jest stale
 * widoczny i można go zwężyć; poniżej `lg` chowa się jako szuflada wysuwana
 * przyciskiem hamburger w nagłówku (klasy `gw-sidebar--mobile-open` w
 * src/styles/custom.css), dzięki czemu treść zajmuje całą szerokość ekranu.
 *
 * Dopóki `AuthProvider` nie skończył wczytywać/odświeżać tokenu
 * (`auth.loading`), nie montujemy `children` - inaczej strony, które odpytują
 * API już w pierwszym `useEffect` (prawie wszystkie listy), zdążyłyby to
 * zrobić bez tokenu. Pasek boczny/nagłówek renderują się od razu.
 */
import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import type { NavGroup } from '@/configs/navigation';
import { findNavTitle, isNavItemActive } from '@/configs/navigation';
import { useSyncAuthToken } from '@/hooks/useSyncAuthToken';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import CONFIG from '@/configs/config';

interface SidebarLayoutProps {
  navigation: NavGroup[];
  /** Elementy w nagłówku po prawej, przed blokiem użytkownika (np. dzwonek). */
  headerRight?: ReactNode;
  children: ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  navigation,
  headerRight,
  children,
}) => {
  // Desktop: pasek zwinięty/rozwinięty. Mobile: szuflada otwarta/zamknięta.
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { pathname, asPath } = useRouter();
  const auth = useAuth();

  useSyncAuthToken();

  const authReady = !auth || auth.loading === false;

  // Etykiety pozycji menu pokazujemy też wtedy, gdy otwarta jest szuflada na
  // telefonie (tam pasek zawsze ma pełną szerokość, niezależnie od stanu
  // zwinięcia z desktopu).
  const showLabels = isSidebarOpen || isMenuOpen;

  const loginHref = pathname.startsWith('/login')
    ? '/login'
    : `/login?returnTo=${encodeURIComponent(asPath)}`;

  const closeMenu = () => setMenuOpen(false);

  // Przy otwartej szufladzie nie przewijamy treści pod spodem.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <div className="gw-page flex h-screen">
      {/* Tło pod szufladą (tylko małe ekrany) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="gw-sidebar"
        aria-label="Menu boczne"
        className={`gw-sidebar ${
          isSidebarOpen ? 'gw-sidebar-open' : 'gw-sidebar-closed'
        } ${isMenuOpen ? 'gw-sidebar--mobile-open' : ''} z-50 flex shrink-0 flex-col shadow-2xl transition-all duration-300`}
      >
        <div className="gw-sidebar-header flex items-center justify-between gap-2 p-4">
          {showLabels && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="gw-brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold">
                <Icon icon="mdi:vector-polyline" className="h-5 w-5" />
              </span>
              <span className="gw-sidebar-title truncate text-lg tracking-tight">
                {CONFIG.app_name}
              </span>
            </div>
          )}

          {/* Desktop: zwijanie paska. Mobile: zamknięcie szuflady. */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="gw-sidebar-icon-btn hidden p-1.5 lg:inline-flex"
            title={isSidebarOpen ? 'Zwiń pasek' : 'Rozwiń pasek'}
          >
            <Icon icon={isSidebarOpen ? 'mdi:chevron-left' : 'mdi:chevron-right'} fontSize={20} />
          </button>
          <button
            type="button"
            onClick={closeMenu}
            className="gw-sidebar-icon-btn p-1.5 lg:hidden"
            title="Zamknij menu"
            aria-label="Zamknij menu"
          >
            <Icon icon="mdi:close" fontSize={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navigation.map((group) => (
            <div key={group.title}>
              {showLabels && <p className="gw-sidebar-group-title mb-2 px-3">{group.title}</p>}
              <div className="space-y-1">
                {group.children.map((item) => {
                  const isActive = isNavItemActive(item, pathname);
                  return (
                    <Link
                      key={item.path}
                      href={item.path === '/login' ? loginHref : item.path}
                      onClick={closeMenu}
                      className={`gw-sidebar-link ${
                        isActive ? 'gw-sidebar-link-active' : ''
                      } flex items-center rounded-xl p-2.5 text-xs font-medium`}
                    >
                      <Icon
                        icon={item.icon}
                        fontSize={20}
                        className={showLabels ? 'mr-3 shrink-0' : 'mx-auto'}
                      />
                      {showLabels && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="gw-sidebar-footer p-4 text-center text-[11px]">
          {showLabels ? CONFIG.footer_text : `v${CONFIG.app_version}`}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          title={findNavTitle(navigation, pathname)}
          onOpenMenu={() => setMenuOpen(true)}
          menuOpen={isMenuOpen}
        >
          {headerRight}
        </AppHeader>

        <main className="gw-page flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {authReady ? (
            children
          ) : (
            <div className="flex items-center gap-2 py-6 text-xs text-slate-500">
              <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
              Sprawdzanie sesji...
            </div>
          )}
        </main>

        <AppFooter />
      </div>
    </div>
  );
};

export default SidebarLayout;
