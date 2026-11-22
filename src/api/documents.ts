// AI dokumenty sprawy - lista, wgranie pliku (nowy dokument albo
// nowa wersja), szczegóły z wersjami i pobranie pliku po weryfikacji skrótu.
import axios from 'axios';
import { apiClient } from './client';
import {
  ActState,
  DocumentDetail,
  DocumentRead,
  DocumentUpload,
  InstanceDocumentRead,
} from '@/types/documents';

/** Komunikat błędu (także dla odpowiedzi typu Blob). */
export const extractDocumentError = async (error: unknown, fallback: string): Promise<string> => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    try {
      const body = data instanceof Blob ? JSON.parse(await data.text()) : data;
      if (typeof body?.detail === 'string') return body.detail;
    } catch {
      // treść nie jest JSON - komunikat ogólny niżej
    }
    if (error.response?.status === 403) return 'Brak uprawnień do dokumentów tej sprawy.';
    if (error.response?.status === 409) return 'Treść pliku nie zgadza się ze skrótem zapisanym przy wgraniu.';
  }
  return fallback;
};

const base = (instanceId: string) => `/process-instances/${instanceId}/documents`;

export const documentsApi = {
  async list(instanceId: string): Promise<InstanceDocumentRead[]> {
    const response = await apiClient.get<InstanceDocumentRead[]>(base(instanceId));
    return response.data;
  },

  async detail(instanceId: string, documentId: string): Promise<DocumentDetail> {
    const response = await apiClient.get<DocumentDetail>(`${base(instanceId)}/${documentId}`);
    return response.data;
  },

  async upload(instanceId: string, upload: DocumentUpload): Promise<DocumentRead> {
    const form = new FormData();
    form.append('file', upload.file);
    if (upload.title) form.append('title', upload.title);
    if (upload.role) form.append('role', upload.role);
    if (upload.documentId) form.append('document_id', upload.documentId);
    if (upload.taskId) form.append('task_id', upload.taskId);
    if (upload.label) form.append('label', upload.label);
    const response = await apiClient.post<DocumentRead>(base(instanceId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return response.data;
  },

  /** status prawny aktu na dzień; null - dokument nie jest aktem w repozytorium. */
  async actState(documentId: string, on?: string): Promise<ActState | null> {
    try {
      const response = await apiClient.get<ActState>(`/acts/${documentId}`, {
        params: on ? { on } : undefined,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  /** Plik wersji (domyślnie bieżącej) jako Blob; hub sprawdza sha256 przed wydaniem. */
  async download(instanceId: string, documentId: string, versionNo?: number) {
    const response = await apiClient.get<Blob>(`${base(instanceId)}/${documentId}/content`, {
      params: versionNo ? { version_no: versionNo } : undefined,
      responseType: 'blob',
      timeout: 120000,
    });
    return { blob: response.data, sha256: response.headers['x-content-sha256'] as string | undefined };
  },

  /** treść aktu w repozytorium - wersja obowiązująca `on` albo historia. */
  async actContent(documentId: string, options: {
    on?: string;
    versionNo?: number;
    download?: boolean;
  } = {}) {
    const response = await apiClient.get<Blob>(`/acts/${documentId}/content`, {
      params: {
        ...(options.on ? { on: options.on } : {}),
        ...(options.versionNo ? { version_no: options.versionNo } : {}),
        ...(options.download ? { download: true } : {}),
      },
      responseType: 'blob',
      timeout: 120000,
    });
    return {
      blob: response.data,
      sha256: response.headers['x-content-sha256'] as string | undefined,
      versionNo: Number(response.headers['x-version-no']) || undefined,
    };
  },
};
