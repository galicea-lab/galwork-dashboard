/**
 * Faktury zakupu z ERPNext oczekujące na akcję workflow "Zatwierdź" - zob.
 * galwork-hub: wf/schemas/wf_schemas.py (PurchaseInvoiceSummary) i
 * wf/services/erpnext_invoice_service.py.
 */

export interface PurchaseInvoiceSummary {
  name: string;
  title: string;
  supplier?: string | null;
  supplier_name?: string | null;
  bill_no?: string | null;
  grand_total?: number | null;
  currency?: string | null;
  posting_date?: string | null;
  due_date?: string | null;
  workflow_state: string;
  /** Pełny link do dokumentu w ERPNext (Frappe Desk) - zbudowany po stronie huba. */
  url: string;
  extra: Record<string, unknown>;
}

export interface PurchaseInvoicePendingApprovalPage {
  items: PurchaseInvoiceSummary[];
  total: number;
}
