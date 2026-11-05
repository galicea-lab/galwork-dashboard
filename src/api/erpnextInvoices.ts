import { apiClient } from './client';
import type { PurchaseInvoicePendingApprovalPage, PurchaseInvoiceSummary } from '@/types/erpnextInvoices';

export const erpnextInvoicesApi = {
  /**
   * Faktury zakupu czekające na "Zatwierdź" w ERPNext (widget "Faktury do
   * zatwierdzenia") - `/v1/wf/erpnext/...` zwraca 503, gdy sekcja
   * `[erpnext]` w config/config.ini (galwork-hub) nie jest skonfigurowana.
   */
  async listPendingApproval(limit = 10): Promise<PurchaseInvoicePendingApprovalPage> {
    const response = await apiClient.get<PurchaseInvoicePendingApprovalPage>(
      '/erpnext/purchase-invoices/pending-approval',
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Wywołuje akcję "Zatwierdź" na fakturze `name` - wymaga grupy Keycloak z
   * `[erpnext] approver_groups` (403, jeśli użytkownik nie jest w grupie).
   */
  async approve(name: string): Promise<PurchaseInvoiceSummary> {
    const response = await apiClient.post<PurchaseInvoiceSummary>(
      `/erpnext/purchase-invoices/${encodeURIComponent(name)}/approve`
    );
    return response.data;
  },
};
