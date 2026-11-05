import { apiClient } from './client';
import type {
  ContactPage,
  PurchaseRequestCreate,
  PurchaseRequestPage,
  PurchaseRequestRead,
} from '@/types/purchaseRequests';

export const purchaseRequestsApi = {
  async list(limit = 50, offset = 0): Promise<PurchaseRequestPage> {
    const response = await apiClient.get<PurchaseRequestPage>('/purchase-requests', {
      params: { limit, offset },
    });
    return response.data;
  },

  async create(payload: PurchaseRequestCreate): Promise<PurchaseRequestRead> {
    const response = await apiClient.post<PurchaseRequestRead>('/purchase-requests', payload);
    return response.data;
  },

  async get(id: string): Promise<PurchaseRequestRead> {
    const response = await apiClient.get<PurchaseRequestRead>(`/purchase-requests/${id}`);
    return response.data;
  },

  /** Wymaga grupy `dzial_zakupow` - zob. purchase_request_api.py::require_dzial_zakupow. */
  async startTender(id: string): Promise<PurchaseRequestRead> {
    const response = await apiClient.post<PurchaseRequestRead>(
      `/purchase-requests/${id}/start-tender`
    );
    return response.data;
  },
};

/** Wyszukiwanie kontrahenta (pole "Dostawca") - zob. wf/routers/contact_api.py. */
export const contactsApi = {
  async search(q: string, limit = 20): Promise<ContactPage> {
    const response = await apiClient.get<ContactPage>('/contacts', {
      params: { q: q || undefined, active_only: true, limit },
    });
    return response.data;
  },
};
