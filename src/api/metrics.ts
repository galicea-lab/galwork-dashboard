// Jedna definicja "licznika" dla kafelków pulpitu i strony
// startowej. Kafelek (src/configs/home.ts, src/configs/regulations.ts) podaje
// klucz `metric`, a ten moduł tłumaczy go na konkretne zapytanie do API
// galwork-hub - dzięki temu konfiguracja wdrożenia nie zna szczegółów HTTP.
import { tasksApi } from './tasks';
import { processInstancesApi } from './processInstances';
import { notificationsApi } from './notifications';
import { legalActsApi } from './legalActs';
import { rolloutsApi } from './rollouts';
import type { ProcessInstanceStatus } from '@/types/processInstances';

/**
 * Dostępne liczniki:
 *  - `task-count`          - Twoje zadania (opcjonalnie w wybranych obiegach),
 *  - `overdue-task-count`  - Twoje zadania po terminie,
 *  - `process-count`       - instancje procesów (`status` wybiera stan),
 *  - `notification-count`  - nieprzeczytane powiadomienia,
 *  - `act-count`           - akty w repozytorium regulacji,
 *  - `active-rollout-count`- wdrożenia obiegów obowiązujące dziś.
 */
export type CountMetric =
  | 'task-count'
  | 'overdue-task-count'
  | 'process-count'
  | 'notification-count'
  | 'act-count'
  | 'active-rollout-count';

export interface CountQuery {
  metric: CountMetric;
  /** Zawęzi licznik do wybranych obiegów (klucze modeli procesów). */
  processModelKeys?: string[] | null;
  /** Tylko dla `process-count`. */
  status?: ProcessInstanceStatus | null;
}

/** Maksymalna strona listy aktów (`GET /acts?limit=`). */
const ACT_LIST_LIMIT = 500;

const today = () => new Date().toISOString().slice(0, 10);

export async function computeCount(query: CountQuery): Promise<number> {
  switch (query.metric) {
    // 2026-11-25: liczniki zadań ze wspólnego podsumowania skrzynki
    // (tasksApi.summary - jedno żądanie dla wszystkich kafelków strony)
    case 'task-count': {
      const summary = await tasksApi.summary();
      const keys = query.processModelKeys ?? [];
      if (keys.length === 0) return summary.total;
      return keys.reduce((sum, key) => sum + (summary.by_process_model[key] ?? 0), 0);
    }
    case 'overdue-task-count': {
      const keys = query.processModelKeys ?? [];
      if (keys.length === 0) return (await tasksApi.summary()).overdue;
      const page = await tasksApi.listMyTasks({ overdue: true, limit: 1, process_model_keys: keys });
      return page.total;
    }
    case 'process-count': {
      const page = await processInstancesApi.listProcessInstances({
        process_model_key: query.processModelKeys?.[0] ?? null,
        status: query.status ?? undefined,
        limit: 1,
      });
      return page.total;
    }
    case 'notification-count': {
      const list = await notificationsApi.listNotifications();
      return list.filter((n) => !n.read_at).length;
    }
    case 'act-count': {
      // Endpoint nie zwraca liczby wszystkich aktów - liczymy maksymalną stronę.
      const acts = await legalActsApi.listActs({ limit: ACT_LIST_LIMIT });
      return acts.length;
    }
    case 'active-rollout-count': {
      const rollouts = await rolloutsApi.listAll({ active_on: today() });
      return rollouts.length;
    }
    default:
      return 0;
  }
}
