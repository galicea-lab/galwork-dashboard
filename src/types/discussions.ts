/** Dyskusje o sprawie w komunikatorze (galwork-hub, wf/services/discussions.py). */
import { UserSummary } from './common';

export interface DiscussionRead {
  id: string;
  human_task_id: string | null;
  url: string;
  title: string | null;
  created_by: UserSummary;
  created_at: string;
}

export interface DiscussionList {
  /** nazwa komunikatora, domyślnie Mattermost */
  provider: string;
  /** adres "Rozpocznij dyskusję"; null - brak konfiguracji */
  start_url: string | null;
  items: DiscussionRead[];
}
