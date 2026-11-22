/**
 * Layout główny dashboardu (podstrony z menu bocznym).
 *
 * Sam wygląd paska bocznego, nagłówka i stopki mieszka w SidebarLayout oraz w
 * src/styles/custom.css - tutaj zostaje tylko to, co jest specyficzne dla
 * głównego dashboardu: menu główne oraz dzwonek powiadomień.
 */
import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@galicea-lab/nextjs-keycloak-auth';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchNotifications, markNotificationsRead } from '@/store/notifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MAIN_NAVIGATION } from '@/configs/navigation';
import { SidebarLayout } from './SidebarLayout';

interface Props {
  children: ReactNode;
}

const TailwindLayout = ({ children }: Props) => {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  const { items: notifications, unreadCount } = useAppSelector(
    (state) => state.notifications
  );

  const authReady = !auth || auth.loading === false;

  // Pierwsze pobranie powiadomień dopiero gdy auth jest gotowe - inaczej
  // pytanie leci bez tokenu (zob. komentarz w SidebarLayout).
  useEffect(() => {
    if (authReady) {
      dispatch(fetchNotifications({ limit: 20 }));
    }
  }, [authReady, dispatch]);

  return (
    <SidebarLayout
      navigation={MAIN_NAVIGATION}
      headerRight={
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkRead={(ids) => dispatch(markNotificationsRead({ ids }))}
          onRefresh={() => dispatch(fetchNotifications({ limit: 20 }))}
        />
      }
    >
      {children}
    </SidebarLayout>
  );
};

export default TailwindLayout;
