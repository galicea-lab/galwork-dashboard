import React, { ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotifications, markNotificationsRead } from '@/store/notifications';
import { setAuthToken } from '@/api/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface Props {
  children: ReactNode;
}

const TailwindLayout = ({ children }: Props) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { pathname, asPath } = useRouter();
  const auth = useAuth();
  const isAdmin = useIsAdmin();
  const dispatch = useAppDispatch();

  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications
  );


  const lastSyncedAccessTokenRef = useRef<string | null>(null);
  const currentAccessToken = auth?.authToken?.access_token ?? null;
  if (lastSyncedAccessTokenRef.current !== currentAccessToken) {
    lastSyncedAccessTokenRef.current = currentAccessToken;
    setAuthToken(currentAccessToken);
  }

  // Dopóki `AuthProvider` nie skończył wczytywać/odświeżać
  // tokenu (`auth.loading`), nie montujemy `children` - inaczej strony,
  // które odpytują API już w swoim pierwszym `useEffect` (prawie
  // wszystkie listy w tej aplikacji), zdążą to zrobić zanim token będzie
  // gotowy (zob. komentarz wyżej). Pasek boczny/nagłówek renderują się od
  // razu - to tylko krótki spinner w obszarze treści, nie pełnoekranowy
  // loader.
  const authReady = !auth || auth.loading === false;

  // Initial fetch for notifications - dopiero gdy auth jest gotowe (ten sam
  // powód co wyżej: inaczej pierwsze pytanie o powiadomienia leci bez tokenu).
  useEffect(() => {
    if (authReady) {
      dispatch(fetchNotifications({ limit: 20 }));
    }
  }, [authReady, dispatch]);

  // logowanie wywołujemy z miejscem powrotu (?returnTo=...) -
  // LoginPage po sukcesie wraca tutaj, a bez parametru przechodzi na '/'.
  const loginHref = pathname.startsWith('/login')
    ? '/login'
    : `/login?returnTo=${encodeURIComponent(asPath)}`;

  const navigation = [
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
    {
      title: 'Zakupy',
      icon: 'mdi:cart-outline',
      children: [
        { title: 'Wnioski zakupowe', path: '/purchase-requests', icon: 'mdi:cart-outline' },
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


  const currentNavTitle =
    navigation.flatMap((g) => g.children).find((i) => i.path === pathname)?.title ||
    (pathname.startsWith('/process-models')
      ? 'Modele procesów'
      : pathname.startsWith('/process-instances')
      ? 'Instancje procesów'
      : pathname.startsWith('/tasks')
      ? 'Moje zadania'
      : pathname.startsWith('/purchase-requests')
      ? 'Wnioski zakupowe'
      : 'Pulpit');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-950 text-white transition-all duration-300 flex flex-col shadow-2xl z-30 shrink-0`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                <Icon icon="mdi:vector-polyline" className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">Galwork Dash</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            title={isSidebarOpen ? 'Zwiń pasek' : 'Rozwiń pasek'}
          >
            <Icon icon={isSidebarOpen ? 'mdi:chevron-left' : 'mdi:menu'} fontSize={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navigation.map((group) => (
            <div key={group.title}>
              {isSidebarOpen && (
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.children.map((item) => {
                  const isActive =
                    pathname === item.path ||
                    (item.path !== '/home' && pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      href={item.path === '/login' ? loginHref : item.path}
                      className={`flex items-center p-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`}
                    >
                      <Icon
                        icon={item.icon}
                        fontSize={20}
                        className={isSidebarOpen ? 'mr-3 shrink-0' : 'mx-auto'}
                      />
                      {isSidebarOpen && <span className="truncate">{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          {isSidebarOpen ? '© 2026 Galwork Dashboard' : 'v1.0'}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sm:px-8 shadow-xs z-20">
          <div className="flex items-center space-x-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">{currentNavTitle}</h2>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Notification Bell */}
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={(ids) => dispatch(markNotificationsRead({ ids }))}
              onRefresh={() => dispatch(fetchNotifications({ limit: 20 }))}
            />

            <div className="h-5 w-px bg-slate-200" />

            {/* Auth / User */}
            {auth.user?.username ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-800 block">
                    {auth.user.username}
                    {isAdmin && ' [Administrator] '}
                  </span>
                  <span className="text-[11px] text-slate-400 block">{auth.user.email}</span>
                </div>
                <button
                  onClick={() => auth.logout()}
                  title="Wyloguj"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <Icon icon="mdi:logout" fontSize={18} />
                </button>
              </div>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors"
                title="Zaloguj"
              >
                <Icon icon="mdi:account" fontSize={16} />
                <span>Zaloguj</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          {authReady ? (
            children
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-6">
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              Sprawdzanie sesji...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TailwindLayout;
