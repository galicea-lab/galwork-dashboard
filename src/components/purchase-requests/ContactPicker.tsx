import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { contactsApi } from '@/api/purchaseRequests';
import { ContactSummary, contactLabel } from '@/types/purchaseRequests';

interface ContactPickerProps {
  value: ContactSummary | null;
  onChange: (contact: ContactSummary | null) => void;
  disabled?: boolean;
}

/** Wyszukiwanie kontrahenta "Dostawca" (ekran "Kontrahenci" trzyma pełny rejestr -
 * tu tylko prosty combobox po `GET /contacts?q=`). */
export const ContactPicker: React.FC<ContactPickerProps> = ({ value, onChange, disabled }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<ContactSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const timer = setTimeout(() => {
      contactsApi
        .search(query)
        .then((page) => setOptions(page.items))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open]);

  return (
    <div className="relative" ref={boxRef}>
      <div
        className={`w-full text-xs px-3 py-2 border rounded-lg flex items-center justify-between gap-2 cursor-text ${
          open ? 'border-blue-500 ring-2 ring-blue-500' : 'border-slate-200'
        } ${disabled ? 'bg-slate-50 opacity-60' : 'bg-white'}`}
        onClick={() => !disabled && setOpen(true)}
      >
        {value ? (
          <span className="truncate font-medium text-slate-800">{contactLabel(value)}</span>
        ) : (
          <input
            type="text"
            value={query}
            disabled={disabled}
            placeholder="Wpisz nazwę, NIP..."
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="flex-1 outline-none bg-transparent"
          />
        )}
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                setQuery('');
              }}
              className="text-slate-400 hover:text-rose-500"
              title="Wyczyść"
            >
              <Icon icon="mdi:close" className="w-3.5 h-3.5" />
            </button>
          )}
          <Icon icon="mdi:chevron-down" className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
              <Icon icon="mdi:loading" className="w-3.5 h-3.5 animate-spin" />
              Szukam...
            </div>
          ) : options.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">Brak wyników - zacznij pisać.</div>
          ) : (
            options.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  // Bez stopPropagation kliknięcie "bąbelkuje" do onClick
                  // kontenera (ten sam box, w którym renderuje się lista) i
                  // natychmiast otwiera listę z powrotem, mimo że wybór już
                  // zaszedł - wygląda, jakby wybór nie działał.
                  e.stopPropagation();
                  onChange(c);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col"
              >
                <span className="font-medium text-slate-800">{contactLabel(c)}</span>
                {c.nip && <span className="text-[11px] text-slate-400">NIP: {c.nip}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ContactPicker;
