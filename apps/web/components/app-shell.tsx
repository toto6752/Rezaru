"use client";

import {
  Activity, ArrowUpRight, BookOpen, Boxes, ChevronDown, CreditCard,
  FileInput, Gauge, KeyRound, LayoutDashboard, Menu, Plug, Settings, Sparkles, Users,
  Webhook, X, Zap
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./logo";

const navigation = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Outcomes", href: "/app/outcomes", icon: Zap },
  { label: "Executions", href: "/app/executions", icon: Activity },
  { label: "Connections", href: "/app/connections", icon: Plug },
  { label: "Templates", href: "/app/templates", icon: Boxes },
  { label: "Import from n8n", href: "/app/import/n8n", icon: FileInput }
];

const secondary = [
  { label: "Team", href: "/app/team", icon: Users },
  { label: "Usage", href: "/app/usage", icon: Gauge },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
  { label: "Settings", href: "/app/settings", icon: Settings }
];

export function AppShell({ children, workspaceName, userName, role, plan }: { children: React.ReactNode; workspaceName: string; userName: string; role: string; plan: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const item = (entry: (typeof navigation)[number]) => {
    const Icon = entry.icon;
    const active = entry.href === "/app" ? pathname === "/app" : pathname.startsWith(entry.href);
    return <Link key={entry.href} className={active ? "active" : ""} href={entry.href} onClick={() => setMobileOpen(false)}><Icon size={16} /><span>{entry.label}</span>{active && <i />}</Link>;
  };

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? "app-sidebar open" : "app-sidebar"}>
        <div className="sidebar-logo"><Logo href="/app" /><button onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <button className="workspace-switcher"><span className="workspace-avatar">{workspaceName.slice(0, 2).toUpperCase()}</span><span><b>{workspaceName}</b><small>{role.toLowerCase()}</small></span><ChevronDown size={14} /></button>
        <nav>
          <span className="nav-label">WORKSPACE</span>
          {navigation.map(item)}
          <span className="nav-label secondary-label">MANAGE</span>
          {secondary.map(item)}
        </nav>
        <div className="sidebar-upgrade">
          <div><Sparkles size={14} /><span>{plan.charAt(0) + plan.slice(1).toLowerCase()} plan</span></div>
          <p>{plan === "FREE" ? "Unlock more outcomes and advanced history." : "Review capacity, invoices, and plan controls."}</p>
          <Link href="/app/billing">{plan === "FREE" ? "View plans" : "Manage plan"} <ArrowUpRight size={13} /></Link>
        </div>
        <div className="sidebar-user"><span>{userName.slice(0, 2).toUpperCase()}</span><div><b>{userName}</b><small>Signed in</small></div><button aria-label="Account menu"><ChevronDown size={14} /></button></div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="topbar-search"><BookOpen size={15} /><span>Search outcomes, executions, and docs…</span><kbd>⌘ K</kbd></div>
          <div className="topbar-actions"><ThemeToggle /><Link href="/app/settings/api-keys"><KeyRound size={16} /></Link><Link href="/app/settings/webhooks"><Webhook size={16} /></Link><Link className="button button-primary button-small" href="/app/outcomes/new"><Zap size={14} /> Create outcome</Link></div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
