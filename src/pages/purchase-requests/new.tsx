import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { purchaseRequestsApi } from '@/api/purchaseRequests';
import { extractApiError } from '@/api/client';
import { ContactPicker } from '@/components/purchase-requests/ContactPicker';
import { ContactSummary, PurchaseExpenseType, PurchaseKind } from '@/types/purchaseRequests';

const EXPENSE_TYPE_OPTIONS: { value: PurchaseExpenseType; label: string }[] = [
  { value: 'operating', label: 'Koszt operacyjny' },
  { value: 'investment', label: 'Inwestycja' },
];

const PURCHASE_KIND_OPTIONS: { value: PurchaseKind; label: string }[] = [
  { value: 'service', label: 'Usługa' },
  { value: 'stock', label: 'Zakup na magazyn' },
];

export default function NewPurchaseRequestPage() {
  const router = useRouter();

  const [contact, setContact] = useState<ContactSummary | null>(null);
  const [title, setTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('PLN');
  const [expenseType, setExpenseType] = useState<PurchaseExpenseType>('operating');
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKind>('service');
  const [projectCode, setProjectCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Tytuł wniosku jest wymagany.');
      return;
    }
    const amountValue = Number(amount.replace(',', '.'));
    if (!amountValue || amountValue <= 0) {
      setError('Kwota szacowana musi być liczbą większą od zera.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await purchaseRequestsApi.create({
        contact_id: contact?.id ?? null,
        title: title.trim(),
        justification: justification.trim() || null,
        amount_estimated: amountValue,
        currency: currency.trim().toUpperCase() || 'PLN',
        expense_type: expenseType,
        purchase_kind: purchaseKind,
        project_code: projectCode.trim() || null,
      });
      router.push(
        created.process_instance_id
          ? `/process-instances/${created.process_instance_id}`
          : '/purchase-requests'
      );
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Nowy wniosek zakupowy | Galwork Dashboard</title>
      </Head>

      <div className="max-w-2xl space-y-6">
        <div>
          <Link
            href="/purchase-requests"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
            Wróć do listy wniosków
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Nowy wniosek zakupowy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Po zapisaniu system wyliczy wymagane akceptacje (kwota, rodzaj wydatku, projekt/MPK) i
            uruchomi obieg &bdquo;Wniosek zakupowy&rdquo;.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dostawca</label>
            <ContactPicker value={contact} onChange={setContact} disabled={submitting} />
            <p className="text-[11px] text-slate-400 mt-1">
              Opcjonalnie - jeśli dostawca nie jest jeszcze znany, można go przypisać później (np.
              po wyborze dostawcy).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tytuł wniosku <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="np. Zakup licencji oprogramowania do pracowni"
              maxLength={500}
              required
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uzasadnienie
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Dlaczego zakup jest potrzebny?"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kwota szacowana <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
                placeholder="np. 12500.00"
                required
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waluta</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={submitting}
                maxLength={3}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rodzaj wydatku <span className="text-rose-500">*</span>
              </label>
              <select
                value={expenseType}
                onChange={(e) => setExpenseType(e.target.value as PurchaseExpenseType)}
                disabled={submitting}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {EXPENSE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rodzaj zakupu <span className="text-rose-500">*</span>
              </label>
              <select
                value={purchaseKind}
                onChange={(e) => setPurchaseKind(e.target.value as PurchaseKind)}
                disabled={submitting}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {PURCHASE_KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Projekt / MPK
            </label>
            <input
              type="text"
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              disabled={submitting}
              placeholder="opcjonalnie - kod projektu/inwestycji/MPK z ERP"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Referencja do ERP (projekty/inwestycje/MPK pozostają jego domeną) - decyduje tylko,
              czy wymagana jest dodatkowa akceptacja właściciela projektu.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/purchase-requests"
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {submitting && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
              <Icon icon="mdi:send" className="w-4 h-4" />
              Złóż wniosek
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
