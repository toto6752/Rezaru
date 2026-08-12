"use client";

import {
  Activity, ArrowUpRight, BookOpen, ChevronDown,
  LayoutDashboard, Menu, Plug, Settings, Sparkles,
  X, Zap
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";
import { LangToggle } from "@/components/lang-toggle";
import { useLang, useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

type NavEntry = { key: UiCopyKey; href: string; icon: typeof LayoutDashboard };

/**
 * Four everyday destinations, matching what the landing page promises: see
 * what happened, manage the agents, connect the channels.
 *
 * Templates, the n8n importer, team, usage and billing still exist and are
 * still reachable — templates from the agent builder, the rest from the
 * settings page. They are off the main menu because an owner running a café
 * needs them once a month at most, and ten entries read as "this is
 * complicated" before a single one is clicked.
 */
const navigation: NavEntry[] = [
  { key: "nav.overview", href: "/app", icon: LayoutDashboard },
  { key: "nav.outcomes", href: "/app/outcomes", icon: Zap },
  { key: "nav.executions", href: "/app/executions", icon: Activity },
  { key: "nav.connections", href: "/app/connections", icon: Plug }
];

const secondary: NavEntry[] = [
  { key: "nav.settings", href: "/app/settings", icon: Settings }
];

export function AppShell({ children, workspaceName, userName, role, plan }: { children: React.ReactNode; workspaceName: string; userName: string; role: string; plan: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang } = useLang();
  const t = useT();

  const item = (entry: NavEntry) => {
    const Icon = entry.icon;
    const active = entry.href === "/app" ? pathname === "/app" : pathname.startsWith(entry.href);
    return <Link key={entry.href} className={active ? "active" : ""} href={entry.href} onClick={() => setMobileOpen(false)}><Icon size={16} /><span>{t(entry.key)}</span>{active && <i />}</Link>;
  };

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? "app-sidebar open" : "app-sidebar"}>
        <div className="sidebar-logo"><Logo href="/app" /><button onClick={() => setMobileOpen(false)} aria-label={t("shell.closeNav")}><X size={18} /></button></div>
        <button className="workspace-switcher"><span className="workspace-avatar">{workspaceName.slice(0, 2).toUpperCase()}</span><span><b>{workspaceName}</b><small>{role.toLowerCase()}</small></span><ChevronDown size={14} /></button>
        <nav>
          <span className="nav-label">{t("shell.workspace").toUpperCase()}</span>
          {navigation.map(item)}
          <span className="nav-label secondary-label">{t("shell.manage").toUpperCase()}</span>
          {secondary.map(item)}
        </nav>
        <div className="sidebar-upgrade">
          <div><Sparkles size={14} /><span>{plan.charAt(0) + plan.slice(1).toLowerCase()} · {t("shell.plan")}</span></div>
          <p>{plan === "FREE" ? t("shell.upgradeFree") : t("shell.upgradePaid")}</p>
          <Link href="/app/billing">{plan === "FREE" ? t("shell.viewPlans") : t("shell.managePlan")} <ArrowUpRight size={13} /></Link>
        </div>
        <div className="sidebar-user"><span>{userName.slice(0, 2).toUpperCase()}</span><div><b>{userName}</b><small>{t("shell.signedIn")}</small></div><button aria-label={t("shell.account")}><ChevronDown size={14} /></button></div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label={t("shell.openNav")}><Menu size={19} /></button>
          <div className="topbar-search"><BookOpen size={15} /><span>{t("shell.search")}…</span><kbd>⌘ K</kbd></div>
          {/* The API-key and webhook shortcuts moved into settings — they were
              two developer icons sitting where an owner looks for the one
              button that matters. */}
          <div className="topbar-actions"><LangToggle lang={lang} onChange={setLang} /><ThemeToggle /><Link className="button button-primary button-small" href="/app/outcomes/new"><Zap size={14} /> {t("shell.create")}</Link></div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      {mobileOpen && <button className="sidebar-scrim" aria-label={t("shell.closeNav")} onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
