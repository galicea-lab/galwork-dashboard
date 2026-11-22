// start obiegu `dokumenty - wariant bez pełnego obiegu wprowadzenia`,
// bez zmian API w hubie.
import { extractApiError } from './client';
import { documentsApi } from './documents';
import { processInstancesApi } from './processInstances';
import type { ActCreateInput, ActCreateResult } from '@/types/acts';

export const ACT_REPOSITORY_MODEL_KEY = 'dokumenty';

export class ActCreationError extends Error {
  readonly instanceId?: string;

  constructor(message: string, instanceId?: string) {
    super(message);
    this.name = 'ActCreationError';
    this.instanceId = instanceId;
  }
}

export const actsApi = {
  async createRepositoryAct(input: ActCreateInput): Promise<ActCreateResult> {
    const instance = await processInstancesApi.startProcessInstance({
      process_model_key: ACT_REPOSITORY_MODEL_KEY,
      title: input.title,
      business_key: input.business_key ?? null,
      data: input.form_data,
    });

    let documentId: string;
    try {
      const document = await documentsApi.upload(instance.id, {
        file: input.file,
        title: input.title,
        role: 'main',
      });
      documentId = document.id;
    } catch (error) {
      throw new ActCreationError(
        `Sprawa ${instance.id} została utworzona, ale wgranie pliku nie powiodło się: ${extractApiError(error)}`,
        instance.id
      );
    }

    await processInstancesApi.wakeProcessInstance(instance.id).catch(() => undefined);

    return { instance_id: instance.id, document_id: documentId };
  },
};

export default actsApi;
