/**
 * Sekcja ZAK – Zakupy i umowy (/zakupy).
 *
 * Faza ZAK.1 KSeF i faktura zakupu (galwork-dev-jw/wdrozenia/galicea/
 * SCENARIUSZ_ZAK.md): faktury przychodzą do ERPNext z KSeF, a informacja o
 * nowej fakturze (n8n albo webhook ERPNext) uruchamia w hubie obieg
 * `faktura-zakupu` – opis merytoryczny, akceptacja, zapis w ERPNext.
 * Faktur nie zakłada się w dashboardzie (`canCreate: false`).
 *
 * Kolejne fazy dopisują się tutaj:
 *  - ZAK.2: rejestry `umowy` i `rejestr-umow`, słownik `kontrahent`,
 *    zestawienia „Umowy wygasające”, „Umowy usługowe bez SLA”,
 *  - ZAK.3: `wniosek-zakupowy` (dziś osobna strona /purchase-requests).
 */
import type { SectionConfig } from '@/types/sections';

export const SECTION_ZAKUPY: SectionConfig = {
  slug: 'zakupy',
  code: 'ZAK',
  title: 'Zakupy i umowy',
  icon: 'mdi:cart-outline',
  description:
    'Faktury zakupu z KSeF trafiają do ERPNext; każda nowa faktura uruchamia obieg: opis ' +
    'merytoryczny (projekt, rodzaj kosztu), akceptacja i zapis w ERPNext. Księgowanie ' +
    'pozostaje w ERPNext.',
  summary: 'Faktury zakupu z KSeF: opis merytoryczny, akceptacja, zapis w ERPNext.',
  phases: ['ZAK.1'],
  registers: [
    {
      slug: 'faktury',
      model: 'faktura-zakupu',
      title: 'Faktury zakupu',
      icon: 'mdi:receipt-text-outline',
      description: 'Faktury z ERPNext w obiegu i po decyzji – opis, akceptacja, status w ERPNext.',
      canCreate: false,
      defaultStatus: 'running',
      phase: 'ZAK.1',
    },
  ],
  dictionaries: [],
  reports: [
    {
      slug: 'w-obiegu-wg-terminu',
      title: 'Faktury w obiegu według terminu płatności',
      description: 'Najbliższe terminy płatności na górze.',
      register: 'faktury',
      status: 'running',
      sort: 'm.termin_platnosci',
      phase: 'ZAK.1',
    },
    {
      slug: 'zaakceptowane',
      title: 'Faktury zaakceptowane',
      register: 'faktury',
      filter: { status_erp: 'zaakceptowana' },
      sort: '-m.termin_platnosci',
      phase: 'ZAK.1',
    },
    {
      slug: 'odrzucone',
      title: 'Faktury odrzucone',
      register: 'faktury',
      filter: { status_erp: 'odrzucona' },
      phase: 'ZAK.1',
    },
  ],
};

export default SECTION_ZAKUPY;
