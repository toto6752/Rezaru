"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

/**
 * Everything that came off the main menu.
 *
 * The daily menu is four entries; these are the once-a-month ones. Grouping
 * them keeps the developer surfaces (keys, webhooks, the n8n importer)
 * visibly separate from the ones an owner actually opens, so nobody goes
 * looking for their invoice among API scopes.
 */
const groups: ReadonlyArray<{ title: UiCopyKey; links: ReadonlyArray<{ key: UiCopyKey; href: string }> }> = [
  {
    title: "set.groupSpace",
    links: [
      { key: "set.general", href: "/app/settings" },
      { key: "nav.team", href: "/app/team" },
      { key: "nav.billing", href: "/app/billing" },
      { key: "nav.usage", href: "/app/usage" }
    ]
  },
  {
    title: "set.groupDev",
    links: [
      { key: "set.security", href: "/app/settings/security" },
      { key: "set.apiKeys", href: "/app/settings/api-keys" },
      { key: "set.webhooks", href: "/app/settings/webhooks" },
      { key: "nav.import", href: "/app/import/n8n" }
    ]
  }
];

export function SettingsNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <aside className="settings-nav dashboard-panel">
      {groups.map((group) => (
        <div key={group.title}>
          <span className="nav-label">{t(group.title).toUpperCase()}</span>
          {group.links.map((link) => (
            <Link key={link.href} className={pathname === link.href ? "active" : ""} href={link.href}>
              {t(link.key)}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
