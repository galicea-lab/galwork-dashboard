/**
 * Wniosek zakupowy - zob. galwork-hub: wf/schemas/wf_schemas.py
 * (PurchaseRequestCreate/Read), wf/services/purchase_request_service.py,
 * galwork-models-book obszary/dzialy/zakupy.md.
 *
 * Tworzony wyłącznie przez `POST /purchase-requests` (ten plik) - NIE przez
 * generyczny "Uruchom nową instancję procesu" (StartProcessInstanceModal),
 * bo reguła akceptacji (kwota/rodzaj wydatku/projekt-MPK -> flagi routingu)
 * jest liczona po stronie serwisu, nie w formularzu startowym BPMN.
 */

import { ProcessInstanceRead } from './processInstances';

export type PurchaseExpenseType = 'operating' | 'investment';
export type PurchaseKind = 'service' | 'stock';

export interface ContactSummary {
  id: string;
  company_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nip?: string | null;
  is_active: boolean;
}

export interface ContactPage {
  items: ContactSummary[];
  total: number;
}

export interface PurchaseRequestCreate {
  /** Opcjonalny - dostawca może zostać przypisany później (np. po obiegu "Wybór dostawcy"). */
  contact_id?: string | null;
  title: string;
  justification?: string | null;
  amount_estimated: number;
  currency: string;
  expense_type: PurchaseExpenseType;
  purchase_kind: PurchaseKind;
  project_code?: string | null;
}

export interface PurchaseRequestRead {
  id: string;
  process_instance_id: string | null;
  tender_process_instance_id: string | null;
  contact_id: string | null;
  title: string;
  justification: string | null;
  amount_estimated: number;
  currency: string;
  expense_type: PurchaseExpenseType;
  purchase_kind: PurchaseKind;
  project_code: string | null;
  requires_investment_approval: boolean;
  requires_project_owner_approval: boolean;
  requires_additional_approval: boolean;
  requires_tender: boolean;
  requires_warehouse_receipt: boolean;
  created_at: string;
  updated_at: string;
  contact: ContactSummary | null;
  process_instance: ProcessInstanceRead | null;
}

export interface PurchaseRequestPage {
  items: PurchaseRequestRead[];
  total: number;
}

export function contactLabel(contact: ContactSummary | null | undefined): string {
  if (!contact) return 'Do wyboru';
  if (contact.company_name) return contact.company_name;
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  return name || contact.nip || contact.id;
}
