// Formatowanie wartości kolumn rejestru według opisu pola
// z `metadata-fields` (typ, format) - lista, zestawienia i eksport CSV.
import type { MetadataField } from '@/types/sections';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatValue(value: unknown, field?: MetadataField): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
  if (Array.isArray(value)) return value.map((item) => formatValue(item)).join(', ');
  if (typeof value === 'object') {
    const label = (value as { label?: unknown }).label;
    return label !== undefined ? String(label) : JSON.stringify(value);
  }
  const text = String(value);
  if (field?.format === 'date') {
    const match = DATE_RE.exec(text.slice(0, 10));
    if (match) return `${match[3]}.${match[2]}.${match[1]}`;
  }
  if (field?.format === 'date-time') {
    const date = new Date(text);
    if (!Number.isNaN(date.valueOf())) return date.toLocaleString('pl-PL');
  }
  return text;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString('pl-PL');
}

/** CSV dla Excela (średnik, BOM UTF-8). */
export function toCsv(header: string[], rows: string[][]): string {
  const cell = (text: string) => (/[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

export function downloadText(content: string, fileName: string, mime = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Wartości filtra pola: enum ze schematu albo Tak/Nie dla pól logicznych. */
export function filterOptions(field: MetadataField): { value: string; label: string }[] | null {
  if (Array.isArray(field.enum) && field.enum.length > 0) {
    return field.enum.map((item) => ({ value: String(item), label: String(item) }));
  }
  const types = Array.isArray(field.type) ? field.type : [field.type];
  if (types.includes('boolean')) {
    return [
      { value: 'true', label: 'Tak' },
      { value: 'false', label: 'Nie' },
    ];
  }
  return null;
}
