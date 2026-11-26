/**
 * Tasks types based on OpenAPI specification
 */

import { PrincipalType, UserSummary } from './common';

export type HumanTaskStatus = 'open' | 'claimed' | 'completed' | 'cancelled';

export interface HumanTaskCandidate {
  principal_type: PrincipalType;
  principal_value: string;
}

export interface HumanTaskRead {
  id: string;
  process_instance_id: string;
  bpmn_task_id: string;
  name: string;
  lane?: string | null;
  status: HumanTaskStatus;
  claimed_by?: UserSummary | null;
  claimed_at?: string | null;
  priority: number;
  due_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  completed_by?: UserSummary | null;
  completed_on_behalf_of?: UserSummary | null;
  candidates: HumanTaskCandidate[];
  /** Bieżąca wersja blokady instancji - do `expected_lock_version` przy claim/complete. */
  process_instance_lock_version: number;
}

export interface MyTaskItem {
  id: string;
  name: string;
  status: HumanTaskStatus;
  priority: number;
  due_at?: string | null;
  created_at: string;
  claimed_by_me: boolean;
  on_behalf_of?: UserSummary | null;
  process_instance_id: string;
  process_title: string;
  process_model_name: string;
  /** Klucz modelu obiegu (wf_schemas.MyTaskItem; hub zwraca go od 2026-11-25). */
  process_model_key?: string | null;
  business_key?: string | null;
  /** Bieżąca wersja blokady instancji - do `expected_lock_version` przy claim/complete. */
  process_instance_lock_version: number;
}

export interface PageMyTaskItem {
  items: MyTaskItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskClaimRequest {
  expected_lock_version: number;
}

export interface TaskCompleteRequest {
  data: Record<string, unknown>;
  expected_lock_version: number;
}

export interface MyTaskFilterParams {
  limit?: number;
  offset?: number;
  only_claimed?: boolean;
  overdue?: boolean;
  // 2026-11-25: zawężenie do obiegów - filtr po stronie huba
  process_model_keys?: string[];
}

// 2026-11-25: GET /tasks/my/summary - liczniki skrzynki w jednym żądaniu
export interface MyTaskSummary {
  total: number;
  overdue: number;
  by_process_model: Record<string, number>;
}
