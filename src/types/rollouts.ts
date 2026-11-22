/**
 * Wdrożenia obiegów - tryb użycia obiegu w jednostkach
 * organizacyjnych na podstawie aktu (galwork-hub, wf/services/rollouts.py).
 */
export type UsageMode = 'test' | 'auxiliary' | 'production';

export interface ProcessRolloutRead {
  id: string;
  process_model_id: string;
  mode: UsageMode;
  /** id jednostek organizacyjnych; pusta lista = cała organizacja */
  org_unit_ids: string[];
  valid_from: string;
  valid_to: string | null;
  act_document_id: string;
  act_version_no: number;
  previous_procedure: string | null;
  process_instance_id: string | null;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
}

export const USAGE_MODE_LABELS: Record<UsageMode, string> = {
  test: 'testowy',
  auxiliary: 'pomocniczy',
  production: 'produkcyjny',
};
