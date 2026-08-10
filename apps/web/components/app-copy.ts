import type { Lang } from "@/components/landing-copy";

/**
 * Strings for the app shell — sidebar, top bar, account row.
 *
 * Only the shell is translated so far. Page bodies inside the product are
 * still English, so switching here changes the menu around them, not their
 * contents. That is deliberate: it gives the control a real effect today
 * without pretending the whole product is localised.
 *
 * The key union is derived from the Russian table rather than declared as an
 * open `Record<string, string>`. Under `noUncheckedIndexedAccess` an open
 * record makes every lookup `string | undefined`, which is what broke the
 * build; a finite key set keeps lookups defined and catches a missing
 * translation at compile time instead of at runtime.
 */
const ru = {
  overview: "Обзор",
  outcomes: "Агенты",
  executions: "Запуски",
  connections: "Подключения",
  templates: "Шаблоны",
  import: "Импорт из n8n",
  team: "Команда",
  usage: "Расход",
  billing: "Оплата",
  settings: "Настройки",
  search: "Поиск по агентам, запускам и справке",
  create: "Создать агента",
  workspace: "Рабочее пространство",
  manage: "Управление",
  signedIn: "Вы вошли"
};

export type AppCopyKey = keyof typeof ru;

const en: Record<AppCopyKey, string> = {
  overview: "Overview",
  outcomes: "Agents",
  executions: "Executions",
  connections: "Connections",
  templates: "Templates",
  import: "Import from n8n",
  team: "Team",
  usage: "Usage",
  billing: "Billing",
  settings: "Settings",
  search: "Search agents, executions and docs",
  create: "Create agent",
  workspace: "Workspace",
  manage: "Manage",
  signedIn: "Signed in"
};

export const appCopy: Record<Lang, Record<AppCopyKey, string>> = { ru, en };
