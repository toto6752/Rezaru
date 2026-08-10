import type { Lang } from "@/components/landing-copy";

/**
 * Strings for the app shell — sidebar, top bar, account row.
 *
 * Only the shell is translated so far. Page bodies inside the product are
 * still English, so switching here changes the menu around them, not their
 * contents. That is deliberate: it gives the control a real effect today
 * without pretending the whole product is localised.
 */
export const appCopy: Record<Lang, Record<string, string>> = {
  ru: {
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
    apiKeys: "Ключи доступа",
    webhooks: "Вебхуки"
  },
  en: {
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
    apiKeys: "API keys",
    webhooks: "Webhooks"
  }
};
