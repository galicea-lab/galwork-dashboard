import type { DashboardLayout, WidgetConfig } from '@/types/dashboardConfig';
import { DEFAULT_DASHBOARD_LAYOUT } from './defaultLayout';

/**
 * Układ pulpitu jest dziś trzymany per-przeglądarka w localStorage - brak
 * zmian w galwork-hub. Jeśli kiedyś przeniesiemy to na backend (per-user,
 * cross-device, z domyślnym układem pushowanym przez admina do wielu
 * użytkowników), wystarczy podmienić implementację `loadDashboardLayout`/
 * `saveDashboardLayout` w tym jednym module - konsument (strona pulpitu)
 * nie musi się zmieniać.
 */

const STORAGE_KEY = 'galwork-dashboard:layout';

export function createWidgetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `widget-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidLayout(value: unknown): value is DashboardLayout {
  if (!value || typeof value !== 'object') return false;
  const layout = value as DashboardLayout;
  return layout.version === 1 && Array.isArray(layout.widgets);
}

export function loadDashboardLayout(): DashboardLayout {
  if (typeof window === 'undefined') {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_DASHBOARD_LAYOUT;
    }
    const parsed = JSON.parse(raw);
    if (!isValidLayout(parsed)) {
      return DEFAULT_DASHBOARD_LAYOUT;
    }
    return parsed;
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function resetDashboardLayout(): DashboardLayout {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return DEFAULT_DASHBOARD_LAYOUT;
}

export function cloneDefaultWidget(widget: WidgetConfig): WidgetConfig {
  return { ...widget, id: createWidgetId() };
}
