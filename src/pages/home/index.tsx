import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Icon } from '@iconify/react';
import { ConfirmDialog } from '@/components/common';
import type { DashboardLayout, WidgetConfig } from '@/types/dashboardConfig';
import { loadDashboardLayout, saveDashboardLayout, resetDashboardLayout } from '@/dashboard/storage';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/dashboard/defaultLayout';
import { WidgetRenderer } from '@/dashboard/widgets/WidgetRenderer';
import { WidgetEditorDialog } from '@/dashboard/WidgetEditorDialog';

export default function Home() {
  // SSR-safe: zaczynamy od domyślnego układu (localStorage nie istnieje po
  // stronie serwera), a po zamontowaniu wczytujemy ewentualny zapisany
  // układ (zob. src/dashboard/storage.ts).
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_DASHBOARD_LAYOUT);
  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTarget, setEditorTarget] = useState<WidgetConfig | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    setLayout(loadDashboardLayout());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveDashboardLayout(layout);
    }
  }, [layout, hydrated]);

  const moveWidget = (id: string, direction: -1 | 1) => {
    setLayout((prev) => {
      const index = prev.widgets.findIndex((w) => w.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.widgets.length) {
        return prev;
      }
      const widgets = [...prev.widgets];
      [widgets[index], widgets[target]] = [widgets[target], widgets[index]];
      return { ...prev, widgets };
    });
  };

  const removeWidget = (id: string) => {
    setLayout((prev) => ({ ...prev, widgets: prev.widgets.filter((w) => w.id !== id) }));
  };

  const saveWidget = (config: WidgetConfig) => {
    setLayout((prev) => {
      const exists = prev.widgets.some((w) => w.id === config.id);
      const widgets = exists
        ? prev.widgets.map((w) => (w.id === config.id ? config : w))
        : [...prev.widgets, config];
      return { ...prev, widgets };
    });
    setEditorOpen(false);
    setEditorTarget(null);
  };

  const openAddWidget = () => {
    setEditorTarget(null);
    setEditorOpen(true);
  };

  const openEditWidget = (config: WidgetConfig) => {
    setEditorTarget(config);
    setEditorOpen(true);
  };

  return (
    <>
      <Head>
        <title>Pulpit główny | Galwork Dashboard</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pulpit główny</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Skonfigurowany pod Twoje zadania - dodawaj, usuwaj i układaj widgety.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editMode && (
              <>
                <button
                  type="button"
                  onClick={openAddWidget}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:plus" className="w-4 h-4" />
                  Dodaj widget
                </button>
                <button
                  type="button"
                  onClick={() => setResetConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Icon icon="mdi:restore" className="w-4 h-4" />
                  Przywróć domyślny
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                editMode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon icon={editMode ? 'mdi:check' : 'mdi:tune-variant'} className="w-4 h-4" />
              {editMode ? 'Zakończ edycję' : 'Dostosuj pulpit'}
            </button>
          </div>
        </div>

        {layout.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-semibold text-slate-700 mb-1">Pulpit jest pusty</p>
            <p className="text-xs text-slate-500 mb-4">Dodaj pierwszy widget, aby zobaczyć tu swoje zadania i procesy.</p>
            <button
              type="button"
              onClick={() => {
                setEditMode(true);
                openAddWidget();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Dodaj widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {layout.widgets.map((widget, index) => (
              <WidgetRenderer
                key={widget.id}
                config={widget}
                editMode={editMode}
                isFirst={index === 0}
                isLast={index === layout.widgets.length - 1}
                onMoveUp={() => moveWidget(widget.id, -1)}
                onMoveDown={() => moveWidget(widget.id, 1)}
                onEdit={() => openEditWidget(widget)}
                onRemove={() => removeWidget(widget.id)}
              />
            ))}
          </div>
        )}
      </div>

      <WidgetEditorDialog
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditorTarget(null);
        }}
        onSave={saveWidget}
        initial={editorTarget}
      />

      <ConfirmDialog
        isOpen={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          setLayout(resetDashboardLayout());
          setResetConfirmOpen(false);
        }}
        title="Przywrócić domyślny pulpit?"
        message="Twoje widgety i ich ułożenie zostaną zastąpione domyślnym zestawem. Tej operacji nie można odwrócić."
        confirmText="Przywróć domyślny"
        variant="warning"
      />
    </>
  );
}
