/**
 * Rejestr sekcji dashboardu (scenariuszy wdrożeniowych).
 *
 * Nowa sekcja = nowy plik konfiguracji i wpis w `SECTIONS`. Ścieżki stron
 * (`getStaticPaths` w src/pages/[section]/**) i menu powstają z tej listy,
 * więc kolejna faza sekcji nie wymaga zmian w komponentach.
 */
import { processInstancesApi } from '@/api/processInstances';
import { tasksApi } from '@/api/tasks';
import type { NavGroup } from '@/configs/navigation';
import type { TileConfig } from '@/types/homeTiles';
import type { RegisterConfig, ReportConfig, SectionConfig } from '@/types/sections';
import { SECTION_IT } from './it';
import { SECTION_ZAKUPY } from './zakupy';

export const SECTIONS: SectionConfig[] = [SECTION_IT, SECTION_ZAKUPY];

/** Segmenty zarezerwowane dla stron sekcji – nie mogą być slugiem rejestru. */
const RESERVED = new Set(['zadania', 'zestawienia']);

export function findSection(slug: string | undefined | null): SectionConfig | undefined {
  return SECTIONS.find((section) => section.slug === slug);
}

/** Rejestry i słowniki sekcji (słownik ma te same strony co rejestr). */
export function sectionRegisters(section: SectionConfig): RegisterConfig[] {
  return [...section.registers, ...section.dictionaries];
}

export function findRegister(
  section: SectionConfig | undefined,
  slug: string | undefined | null
): RegisterConfig | undefined {
  return section ? sectionRegisters(section).find((register) => register.slug === slug) : undefined;
}

export function findReport(
  section: SectionConfig | undefined,
  slug: string | undefined | null
): ReportConfig | undefined {
  return section?.reports.find((report) => report.slug === slug);
}

/** Klucze modeli sekcji (zadania sekcji, liczniki). */
export function sectionModelKeys(section: SectionConfig): string[] {
  return sectionRegisters(section).map((register) => register.model);
}

export function registerPath(section: SectionConfig, register: RegisterConfig): string {
  return `/${section.slug}/${register.slug}`;
}

export function recordPath(section: SectionConfig, register: RegisterConfig, id: string): string {
  return `${registerPath(section, register)}/karta?id=${encodeURIComponent(id)}`;
}

/** Ścieżki do `getStaticPaths`: rejestry i słowniki wszystkich sekcji. */
export function allRegisterParams(): { section: string; register: string }[] {
  return SECTIONS.flatMap((section) =>
    sectionRegisters(section).map((register) => ({ section: section.slug, register: register.slug }))
  );
}

export function allReportParams(): { section: string; report: string }[] {
  return SECTIONS.flatMap((section) =>
    section.reports.map((report) => ({ section: section.slug, report: report.slug }))
  );
}

/**
 * Kafelek sekcji na stronie głównej („Twoje obszary pracy”, src/configs/home.ts):
 * link do pulpitu sekcji, licznik Twoich zadań w modelach sekcji i zadań po terminie.
 */
export function sectionTile(section: SectionConfig): TileConfig {
  const processModelKeys = sectionModelKeys(section);
  return {
    id: `sekcja-${section.slug}`,
    title: section.title,
    description: section.summary ?? section.description,
    icon: section.icon,
    href: `/${section.slug}`,
    count: { metric: 'task-count', processModelKeys },
    overdue: { metric: 'overdue-task-count', processModelKeys },
  };
}

export function sectionTiles(): TileConfig[] {
  return SECTIONS.map(sectionTile);
}

/** Strona skrzynki zadań do sprawdzenia przynależności (hub nie filtruje po modelu). */
const TASKS_FETCH_LIMIT = 200;

/**
 * 2026-11-22: slugi sekcji, w których użytkownik ma otwarte zadania albo
 * widzi co najmniej jedną sprawę (lista spraw huba pokazuje tylko sprawy
 * widoczne dla użytkownika - uczestnik, kandydat zadania, rejestr jawny,
 * administrator procesów). Błąd zapytania nie ukrywa sekcji.
 */
export async function sectionsWithWork(sections: SectionConfig[] = SECTIONS): Promise<Set<string>> {
  const tasks = await tasksApi.listMyTasks({ limit: TASKS_FETCH_LIMIT }).catch(() => null);
  const taskKeys = new Set((tasks?.items ?? []).map((task) => task.process_model_key ?? ''));
  const result = new Set<string>();
  await Promise.all(
    sections.map(async (section) => {
      const keys = sectionModelKeys(section);
      if (tasks === null || keys.some((key) => taskKeys.has(key))) {
        result.add(section.slug);
        return;
      }
      const pages = await Promise.all(
        keys.map((key) =>
          processInstancesApi.listProcessInstances({ process_model_key: key, limit: 1 }).catch(() => null)
        )
      );
      if (pages.some((page) => page === null || page.total > 0)) result.add(section.slug);
    })
  );
  return result;
}

/** Menu boczne sekcji: pulpit, rejestry, słowniki, zestawienia, zadania. */
export function sectionNavigation(section: SectionConfig): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: section.title,
      icon: section.icon,
      children: [
        { title: 'Pulpit sekcji', path: `/${section.slug}`, icon: 'mdi:view-dashboard-outline' },
        ...section.registers.map((register) => ({
          title: register.title,
          path: registerPath(section, register),
          icon: register.icon ?? 'mdi:format-list-bulleted',
        })),
        { title: 'Moje zadania w sekcji', path: `/${section.slug}/zadania`, icon: 'mdi:checkbox-marked-circle-outline' },
      ],
    },
  ];
  if (section.dictionaries.length > 0) {
    groups.push({
      title: 'Słowniki',
      icon: 'mdi:book-open-variant',
      children: section.dictionaries.map((dictionary) => ({
        title: dictionary.title,
        path: registerPath(section, dictionary),
        icon: dictionary.icon ?? 'mdi:book-outline',
      })),
    });
  }
  if (section.reports.length > 0) {
    groups.push({
      title: 'Zestawienia',
      icon: 'mdi:table-search',
      children: section.reports.map((report) => ({
        title: report.title,
        path: `/${section.slug}/zestawienia/${report.slug}`,
        icon: 'mdi:file-table-outline',
      })),
    });
  }
  groups.push({
    title: 'Start',
    icon: 'mdi:home-outline',
    children: [
      { title: 'Pulpit główny', path: '/home', icon: 'mdi:view-dashboard' },
      { title: 'Strona startowa', path: '/', icon: 'mdi:home-outline' },
    ],
  });
  return groups;
}

// Kontrola konfiguracji przy budowie: slug rejestru nie może zasłonić stron sekcji.
for (const section of SECTIONS) {
  for (const register of sectionRegisters(section)) {
    if (RESERVED.has(register.slug)) {
      throw new Error(`Sekcja ${section.slug}: slug rejestru „${register.slug}” jest zarezerwowany`);
    }
  }
  for (const report of section.reports) {
    if (!findRegister(section, report.register)) {
      throw new Error(`Sekcja ${section.slug}: zestawienie „${report.slug}” wskazuje nieznany rejestr`);
    }
  }
}
