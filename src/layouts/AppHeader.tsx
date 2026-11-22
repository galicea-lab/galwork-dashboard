/**
 * Wspólny nagłówek strony (pasek górny) dla wszystkich layoutów:
 * strony głównej i logowania (bez paska bocznego) oraz podstron (z paskiem).
 *
 * Wariant wyglądu wybiera `tone`: `light` (jasny pasek podstron, kolory z
 * `--gw-header-*`) albo `brand` (ciemny pasek w stylu galwork-www, tylko na
 * stronie głównej i logowaniu - klasy `gw-home-*` w src/styles/custom.css).
 */
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import CONFIG from '@/configs/config';

interface AppHeaderProps {
  /** Tytuł bieżącej strony (np. "Moje zadania"). */
  title?: string;
  /** Dodatkowe elementy po prawej, przed blokiem użytkownika (np. dzwonek). */
  children?: ReactNode;
  /** Pokazuje znaczek i nazwę systemu po lewej (strona główna, logowanie). */
  showBrand?: boolean;
  /** `light` - jasny pasek podstron (domyślnie), `brand` - ciemny pasek strony głównej. */
  tone?: 'light' | 'brand';
  /** Otwiera szufladę menu na małych ekranach (przycisk hamburger). */
  onOpenMenu?: () => void;
  menuOpen?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  children,
  showBrand = false,
  tone = 'light',
  onOpenMenu,
  menuOpen = false,
}) => {
  const { pathname, asPath } = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();

  // Logowanie z powrotem na tę samą stronę (?returnTo=...). LoginPage po
  // sukcesie wraca pod podany adres; bez parametru przechodzi na '/'.
  const loginHref = pathname.startsWith('/login')
    ? '/login'
    : `/login?returnTo=${encodeURIComponent(asPath)}`;

  return (
    <header
      className={`gw-header ${
        tone === 'brand' ? 'gw-header--brand' : ''
      } flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger - tylko na małych ekranach, gdy layout ma pasek boczny. */}
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="gw-header-icon-btn p-1.5 lg:hidden"
            aria-label="Otwórz menu"
            aria-controls="gw-sidebar"
            aria-expanded={menuOpen}
            data-gw-burger="true"
          >
            <Icon icon="mdi:menu" fontSize={22} />
          </button>
        )}

        {showBrand && (
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="gw-brand-mark flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon icon="mdi:vector-polyline" className="h-5 w-5" />
            </span>
            <span className="gw-header-title truncate text-base font-bold">{CONFIG.app_name}</span>
          </Link>
        )}

        {title && <h2 className="gw-header-title truncate text-base font-bold sm:text-lg">{title}</h2>}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {children}
        {children && <div className="h-5 w-px bg-slate-200" />}

        {auth.user?.username ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <span className="gw-header-user-name block text-xs font-semibold text-slate-800">
                {auth.user.username}
                {isAdmin && ' [Administrator] '}
              </span>
              <span className="gw-header-user-mail block text-[11px] text-slate-400">
                {auth.user.email}
              </span>
            </div>
            <button
              type="button"
              onClick={() => auth.logout()}
              title="Wyloguj"
              className="gw-header-icon-btn flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600"
            >
              <Icon icon="mdi:logout" fontSize={18} />
            </button>
          </div>
        ) : (
          <Link
            href={loginHref}
            className={
              tone === 'brand'
                ? 'gw-home-button gw-home-button--gold'
                : 'gw-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold'
            }
            title="Zaloguj"
          >
            <Icon icon="mdi:account" fontSize={16} />
            <span>Zaloguj</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
