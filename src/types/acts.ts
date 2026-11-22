// kontrakt szybkiego dodania aktu do repozytorium.
export interface ActCreateInput {
  form_data: Record<string, unknown>;
  file: File;
  title: string;
  business_key?: string | null;
}

export interface ActCreateResult {
  instance_id: string;
  document_id: string;
}
