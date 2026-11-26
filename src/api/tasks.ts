import { apiClient } from './client';
import {
  HumanTaskRead,
  PageMyTaskItem,
  MyTaskFilterParams,
  MyTaskSummary,
  TaskClaimRequest,
  TaskCompleteRequest,
} from '@/types/tasks';
import { ProcessInstanceRead } from '@/types/processInstances';

// 2026-11-25: jedno podsumowanie skrzynki dla wszystkich kafelków i sekcji
// strony - równoległe wywołania dzielą to samo żądanie, a wynik żyje krótko
// (po podjęciu albo wykonaniu zadania jest unieważniany).
const SUMMARY_TTL_MS = 10_000;
let summaryCache: { at: number; promise: Promise<MyTaskSummary> } | null = null;

function invalidateSummary(): void {
  summaryCache = null;
}

/** Parametry listy zadań; tablica kluczy jako powtórzony `process_model_key`. */
function myTasksParams(params?: MyTaskFilterParams): URLSearchParams {
  const search = new URLSearchParams();
  const { process_model_keys: keys, ...rest } = params ?? {};
  Object.entries(rest).forEach(([name, value]) => {
    if (value !== undefined && value !== null) search.append(name, String(value));
  });
  (keys ?? []).forEach((key) => search.append('process_model_key', key));
  return search;
}

export const tasksApi = {
  /**
   * 2026-11-13: szybka akcja zadania - uruchamia osobną instancję modelu
   * `processModelKey` powiązaną z instancją zadania.
   */
  async runQuickAction(taskId: string, processModelKey: string): Promise<ProcessInstanceRead> {
    const response = await apiClient.post<ProcessInstanceRead>(
      `/tasks/${taskId}/quick-actions/${encodeURIComponent(processModelKey)}`
    );
    return response.data;
  },

  /**
   * Skrzynka zadań: podjęte przez użytkownika oraz otwarte, do których ma prawo.
   */
  async listMyTasks(params?: MyTaskFilterParams): Promise<PageMyTaskItem> {
    const response = await apiClient.get<PageMyTaskItem>('/tasks/my', {
      params: myTasksParams(params),
    });
    return response.data;
  },

  /**
   * Liczniki skrzynki: wszystkie zadania, po terminie i według obiegów.
   */
  summary(): Promise<MyTaskSummary> {
    const now = Date.now();
    if (summaryCache && now - summaryCache.at < SUMMARY_TTL_MS) return summaryCache.promise;
    const promise = apiClient.get<MyTaskSummary>('/tasks/my/summary').then((response) => response.data);
    summaryCache = { at: now, promise };
    // błąd nie zostaje w pamięci - następne wywołanie spróbuje ponownie
    promise.catch(() => {
      if (summaryCache?.promise === promise) invalidateSummary();
    });
    return promise;
  },

  /**
   * Pobiera szczegóły zadania po ID.
   */
  async getTask(taskId: string): Promise<HumanTaskRead> {
    const response = await apiClient.get<HumanTaskRead>(`/tasks/${taskId}`);
    return response.data;
  },

  /**
   * Podjęcie zadania przez zalogowanego użytkownika (claim).
   */
  async claimTask(taskId: string, request: TaskClaimRequest): Promise<HumanTaskRead> {
    const response = await apiClient.post<HumanTaskRead>(`/tasks/${taskId}/claim`, request);
    invalidateSummary();
    return response.data;
  },

  /**
   * Wykonuje i kończy zadanie (complete): waliduje dane, wykonuje krok w silniku.
   */
  async completeTask(taskId: string, request: TaskCompleteRequest): Promise<HumanTaskRead> {
    const response = await apiClient.post<HumanTaskRead>(`/tasks/${taskId}/complete`, request);
    invalidateSummary();
    return response.data;
  },
};
