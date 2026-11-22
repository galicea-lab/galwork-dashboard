/**
 * Sekcja IT – Informatyka i bezpieczeństwo informacji (/it).
 *
 * Faza IT.1 Inwentaryzacja systemów i usług (galwork-dev-jw/wdrozenia/galicea/
 * SCENARIUSZ_IT.md). Kolejne fazy dopisują się tutaj, bez nowych stron:
 *  - IT.2: rejestry `rejestracja-sprzetu-it` (Sprzęt) i `zgloszenie-serwisowe`
 *    (Zgłoszenia), zestawienie „Sprzęt bez szyfrowania”,
 *  - IT.3: `licencje-subskrypcje`, `zgloszenie-zmiany`, słownik `rejestr-zmian`.
 */
import type { SectionConfig } from '@/types/sections';

export const SECTION_IT: SectionConfig = {
  slug: 'it',
  code: 'IT',
  title: 'Informatyka',
  icon: 'mdi:server-network',
  description:
    'Systemy i usługi, z których korzysta organizacja: właściciel, dostawca, lokalizacja ' +
    'danych, umowa powierzenia, kopie zapasowe. Rejestr zasila wybór systemu w zgłoszeniach ' +
    'i zmianach oraz rejestr czynności przetwarzania (sekcja Ochrona danych).',
  summary: 'Rejestr systemów i usług, domeny i certyfikaty, zestawienia dla RODO.',
  phases: ['IT.1'],
  registers: [
    {
      slug: 'systemy',
      model: 'rejestr-systemow',
      title: 'Systemy i usługi',
      icon: 'mdi:server',
      description: 'Rejestr systemów i usług IT – wpis, przegląd, aktualizacja albo wycofanie.',
      newLabel: 'Nowy system',
      titleField: 'nazwa',
      defaultStatus: 'running',
      phase: 'IT.1',
    },
  ],
  dictionaries: [
    {
      slug: 'domeny',
      model: 'domeny',
      title: 'Domeny i certyfikaty',
      icon: 'mdi:web',
      description: 'Domeny, rejestratorzy, terminy wygaśnięcia i certyfikaty TLS.',
      newLabel: 'Nowa domena',
      titleField: 'domena',
      defaultStatus: 'running',
      phase: 'IT.1',
    },
  ],
  reports: [
    {
      slug: 'bez-umowy-powierzenia',
      title: 'Systemy bez umowy powierzenia',
      description: 'Umowa powierzenia „do zawarcia” – lista do uzupełnienia w sekcji Ochrona danych.',
      register: 'systemy',
      filter: { umowa_powierzenia: 'do zawarcia' },
      status: 'running',
      columns: ['nazwa', 'wlasciciel', 'dostawca', 'dane_osobowe'],
      phase: 'IT.1',
    },
    {
      slug: 'dane-poza-eog',
      title: 'Dane poza EOG',
      description: 'Systemy przechowujące dane poza Europejskim Obszarem Gospodarczym.',
      register: 'systemy',
      filter: { lokalizacja_danych: 'poza EOG' },
      status: 'running',
      columns: ['nazwa', 'dostawca', 'model_utrzymania', 'umowa_powierzenia'],
      phase: 'IT.1',
    },
    {
      slug: 'domeny-wg-wygasniecia',
      title: 'Domeny według daty wygaśnięcia',
      description: 'Najbliższe terminy odnowienia na górze.',
      register: 'domeny',
      sort: 'm.data_wygasniecia',
      status: 'running',
      phase: 'IT.1',
    },
  ],
};

export default SECTION_IT;
