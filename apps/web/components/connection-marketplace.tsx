"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Bot, Braces, CalendarClock, Check, Database, FileSpreadsheet, Globe, Instagram, Loader2, Mail,
  MessageCircle, MessageSquare, Plug, Search, Send, Timer, Trash2, Webhook, X, Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusDot } from "./ui";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

type CredentialField = { key: string; label: string; hint: string; secret: boolean };
type Connector = {
  key: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  documentationUrl: string;
  environmentRequirements?: string[];
  credentialFields?: CredentialField[];
};

/**
 * What to ask for when the connector does not spell it out.
 *
 * The channels declare their own fields because they need two; everything
 * older still implies exactly one from its auth type.
 */
/** Catalogue categories arrive as English enum values from the registry. */
const categoryKeys: Record<string, UiCopyKey> = {
  Channels: "conn.channels",
  Communication: "conn.catCommunication",
  CRM: "conn.catCRM",
  Marketing: "conn.catMarketing",
  Finance: "conn.catFinance",
  Databases: "conn.catDatabases",
  AI: "conn.catAI",
  "Developer tools": "conn.catDeveloper",
  Productivity: "conn.catProductivity"
};

function fieldsFor(connector: Connector, t: (key: UiCopyKey) => string): CredentialField[] {
  if (connector.credentialFields?.length) return connector.credentialFields;
  if (connector.authType === "none") return [];
  const key = connector.authType === "connection_string" ? "connectionString" : connector.authType === "api_key" ? "apiKey" : "accessToken";
  const label = connector.authType === "connection_string" ? t("conn.connectionString") : connector.authType === "api_key" ? t("conn.apiKey") : t("conn.accessToken");
  return [{ key, label, hint: "", secret: true }];
}
type Connection = { id: string; name: string; connectorKey: string; status: string; lastTestedAt: string | Date | null; lastError: string | null; _count: { outcomes: number } };

const icons: Record<string, typeof Plug> = {
  telegram: Send, whatsapp: MessageCircle, instagram: Instagram,
  webhook: Webhook, schedule: CalendarClock, http: Globe, slack: MessageSquare, gmail: Mail,
  google_sheets: FileSpreadsheet, postgresql: Database, openai: Bot, delay: Timer, transform: Braces
};

export function ConnectionMarketplace({ connectors, initialConnections }: { connectors: Connector[]; initialConnections: Connection[] }) {
  const t = useT();
  const [connections, setConnections] = useState(initialConnections);
  const [search, setSearch] = useState("");
  // "All" is the sentinel for "no category filter", not a label — the visible
  // text for it comes from the dictionary.
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Connector | null>(null);
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const categories = ["All", ...new Set(connectors.map((connector) => connector.category))];
  const filtered = useMemo(() => connectors.filter((connector) =>
    (category === "All" || connector.category === category) &&
    `${connector.name} ${connector.description}`.toLowerCase().includes(search.toLowerCase())
  ), [category, connectors, search]);

  const fields = selected ? fieldsFor(selected, t) : [];
  const complete = fields.every((field) => credentials[field.key]?.trim());

  function open(connector: Connector) {
    setSelected(connector);
    setName(`${connector.name}${t("conn.suffix")}`);
    setCredentials({});
    setError("");
  }

  async function connect() {
    if (!selected) return;
    setLoading("connect");
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ connectorKey: selected.key, name, credentials })
    });
    const body = await response.json() as { data?: Connection; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) {
      setError(body.error?.message ?? t("conn.failed"));
      return;
    }
    setConnections((current) => [...current, { ...body.data!, _count: { outcomes: 0 } }]);
    setSelected(null);
  }

  async function test(connection: Connection) {
    setLoading(connection.id);
    const response = await fetch(`/api/connections/${connection.id}/test`, { method: "POST" });
    const body = await response.json() as { data?: { ok: boolean; message: string } };
    setLoading("");
    setConnections((current) => current.map((item) => item.id === connection.id ? { ...item, status: body.data?.ok ? "CONNECTED" : "NEEDS_ATTENTION", lastError: body.data?.ok ? null : body.data?.message ?? t("conn.testFailed"), lastTestedAt: new Date().toISOString() } : item));
  }

  async function remove(connection: Connection) {
    if (!window.confirm(`${connection.name}\n\n${t("conn.confirmDelete")}`)) return;
    setLoading(connection.id);
    const response = await fetch(`/api/connections/${connection.id}`, { method: "DELETE" });
    setLoading("");
    if (response.ok) setConnections((current) => current.filter((item) => item.id !== connection.id));
  }

  return <div className="connections-page">
    <header className="page-header"><div><span className="page-eyebrow">{t("conn.eyebrow")}</span><h1>{t("conn.title")}</h1><p>{t("conn.lead")}</p></div></header>
    {connections.length > 0 && <section className="connected-section"><div className="section-title"><h2>{t("conn.yours")}</h2><span>{connections.length} {t("conn.configured")}</span></div><div className="connected-grid">
      {connections.map((connection) => {
        const connector = connectors.find((item) => item.key === connection.connectorKey);
        const Icon = icons[connection.connectorKey] ?? Plug;
        return <article key={connection.id}><span className="connector-icon"><Icon size={19} /></span><div><h3>{connection.name}</h3><p>{connector?.name} · {t("conn.usedBy")} {connection._count.outcomes}</p><StatusDot status={connection.status} /></div><div className="connection-actions"><button onClick={() => test(connection)} disabled={loading === connection.id}>{loading === connection.id ? <Loader2 className="spin" size={14} /> : <Zap size={14} />} {t("conn.test")}</button><button onClick={() => remove(connection)} disabled={loading === connection.id} aria-label={`${t("conn.delete")}: ${connection.name}`}><Trash2 size={14} /></button></div>{connection.lastError && <p className="connection-error">{connection.lastError}</p>}</article>;
      })}
    </div></section>}
    <section className="marketplace-section"><div className="section-title"><h2>{t("conn.market")}</h2><span>{connectors.length} {t("conn.approved")}</span></div>
      <div className="marketplace-tools"><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("conn.search")} /></div><div>{categories.map((item) => {
        const labelKey = categoryKeys[item];
        return <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item === "All" ? t("conn.all") : labelKey ? t(labelKey) : item}</button>;
      })}</div></div>
      <div className="connector-grid">{filtered.map((connector) => {
        const Icon = icons[connector.key] ?? Plug;
        const connected = connections.some((connection) => connection.connectorKey === connector.key);
        return <article key={connector.key}><span className="connector-icon"><Icon size={20} /></span><div className="connector-title"><h3>{connector.name}</h3>{connected && <span><Check size={11} /> {t("conn.connected")}</span>}</div><p>{connector.description}</p><footer><span>{connector.authType === "none" ? t("conn.noCreds") : connector.authType.replace("_", " ")}</span><button onClick={() => open(connector)}>{connected ? t("conn.addAnother") : t("conn.connect")}</button></footer></article>;
      })}</div>
    </section>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(openValue) => !openValue && setSelected(null)}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content">
        <Dialog.Close className="dialog-close"><X size={17} /></Dialog.Close>
        <div className="dialog-icon"><Plug size={20} /></div>
        <Dialog.Title>{t("conn.dialogTitle")} {selected?.name}</Dialog.Title>
        <Dialog.Description>{selected?.description}</Dialog.Description>
        {selected?.environmentRequirements?.length ? <div className="setup-warning"><span>{t("conn.oauthSetup")}</span><p>{t("conn.oauthCopy")} {selected.environmentRequirements.join(", ")}. {t("conn.oauthTail")}</p></div> : null}
        <label>{t("conn.name")}<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        {fields.map((field) => <label key={field.key}>
          {field.label}
          <input
            type={field.secret ? "password" : "text"}
            value={credentials[field.key] ?? ""}
            onChange={(event) => setCredentials((current) => ({ ...current, [field.key]: event.target.value }))}
            placeholder={process.env.NODE_ENV === "development" ? t("conn.credPlaceholderDev") : t("conn.credPlaceholder")}
          />
          {/* Where to find the value — the person filling this in has never
              opened a developer console and should not have to search. */}
          {field.hint && <small className="field-hint">{field.hint}</small>}
        </label>)}
        {selected && <a className="connector-docs" href={selected.documentationUrl} target="_blank" rel="noreferrer">{t("conn.docs")}</a>}
        {error && <div className="form-message error">{error}</div>}
        <div className="dialog-actions"><Dialog.Close className="button button-secondary">{t("common.cancel")}</Dialog.Close><button className="button button-primary" disabled={loading === "connect" || !name || !complete} onClick={connect}>{loading === "connect" ? <Loader2 className="spin" size={14} /> : <Plug size={14} />} {t("conn.connectAndTest")}</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
