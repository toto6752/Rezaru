"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Bot, Braces, CalendarClock, Check, Database, FileSpreadsheet, Globe, Loader2, Mail,
  MessageSquare, Plug, Search, Timer, Trash2, Webhook, X, Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { StatusDot } from "./ui";

type Connector = {
  key: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  documentationUrl: string;
  environmentRequirements?: string[];
};
type Connection = { id: string; name: string; connectorKey: string; status: string; lastTestedAt: string | Date | null; lastError: string | null; _count: { outcomes: number } };

const icons: Record<string, typeof Plug> = {
  webhook: Webhook, schedule: CalendarClock, http: Globe, slack: MessageSquare, gmail: Mail,
  google_sheets: FileSpreadsheet, postgresql: Database, openai: Bot, delay: Timer, transform: Braces
};

export function ConnectionMarketplace({ connectors, initialConnections }: { connectors: Connector[]; initialConnections: Connection[] }) {
  const [connections, setConnections] = useState(initialConnections);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Connector | null>(null);
  const [name, setName] = useState("");
  const [credential, setCredential] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const categories = ["All", ...new Set(connectors.map((connector) => connector.category))];
  const filtered = useMemo(() => connectors.filter((connector) =>
    (category === "All" || connector.category === category) &&
    `${connector.name} ${connector.description}`.toLowerCase().includes(search.toLowerCase())
  ), [category, connectors, search]);

  function open(connector: Connector) {
    setSelected(connector);
    setName(`${connector.name} connection`);
    setCredential("");
    setError("");
  }

  async function connect() {
    if (!selected) return;
    setLoading("connect");
    const field = selected.authType === "connection_string" ? "connectionString" : selected.authType === "api_key" ? "apiKey" : "accessToken";
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectorKey: selected.key,
        name,
        credentials: selected.authType === "none" ? {} : { [field]: credential }
      })
    });
    const body = await response.json() as { data?: Connection; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) {
      setError(body.error?.message ?? "Could not connect");
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
    setConnections((current) => current.map((item) => item.id === connection.id ? { ...item, status: body.data?.ok ? "CONNECTED" : "NEEDS_ATTENTION", lastError: body.data?.ok ? null : body.data?.message ?? "Test failed", lastTestedAt: new Date().toISOString() } : item));
  }

  async function remove(connection: Connection) {
    if (!window.confirm(`Delete ${connection.name}? Encrypted credentials will be removed with it.`)) return;
    setLoading(connection.id);
    const response = await fetch(`/api/connections/${connection.id}`, { method: "DELETE" });
    setLoading("");
    if (response.ok) setConnections((current) => current.filter((item) => item.id !== connection.id));
  }

  return <div className="connections-page">
    <header className="page-header"><div><span className="page-eyebrow">SECURE INTEGRATIONS</span><h1>Connections</h1><p>Connect the tools Rezaru can use on your behalf. Secrets stay encrypted and server-side.</p></div></header>
    {connections.length > 0 && <section className="connected-section"><div className="section-title"><h2>Your connections</h2><span>{connections.length} configured</span></div><div className="connected-grid">
      {connections.map((connection) => {
        const connector = connectors.find((item) => item.key === connection.connectorKey);
        const Icon = icons[connection.connectorKey] ?? Plug;
        return <article key={connection.id}><span className="connector-icon"><Icon size={19} /></span><div><h3>{connection.name}</h3><p>{connector?.name} · used by {connection._count.outcomes} outcomes</p><StatusDot status={connection.status} /></div><div className="connection-actions"><button onClick={() => test(connection)} disabled={loading === connection.id}>{loading === connection.id ? <Loader2 className="spin" size={14} /> : <Zap size={14} />} Test</button><button onClick={() => remove(connection)} disabled={loading === connection.id} aria-label={`Delete ${connection.name}`}><Trash2 size={14} /></button></div>{connection.lastError && <p className="connection-error">{connection.lastError}</p>}</article>;
      })}
    </div></section>}
    <section className="marketplace-section"><div className="section-title"><h2>Connector marketplace</h2><span>{connectors.length} approved connectors</span></div>
      <div className="marketplace-tools"><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search connectors…" /></div><div>{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
      <div className="connector-grid">{filtered.map((connector) => {
        const Icon = icons[connector.key] ?? Plug;
        const connected = connections.some((connection) => connection.connectorKey === connector.key);
        return <article key={connector.key}><span className="connector-icon"><Icon size={20} /></span><div className="connector-title"><h3>{connector.name}</h3>{connected && <span><Check size={11} /> Connected</span>}</div><p>{connector.description}</p><footer><span>{connector.authType === "none" ? "No credentials" : connector.authType.replace("_", " ")}</span><button onClick={() => open(connector)}>{connected ? "Add another" : "Connect"}</button></footer></article>;
      })}</div>
    </section>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(openValue) => !openValue && setSelected(null)}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content">
        <Dialog.Close className="dialog-close"><X size={17} /></Dialog.Close>
        <div className="dialog-icon"><Plug size={20} /></div>
        <Dialog.Title>Connect {selected?.name}</Dialog.Title>
        <Dialog.Description>{selected?.description}</Dialog.Description>
        {selected?.environmentRequirements?.length ? <div className="setup-warning"><span>OAuth setup</span><p>For hosted OAuth, configure {selected.environmentRequirements.join(" and ")}. An existing access token can be used below for local development.</p></div> : null}
        <label>Connection name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        {selected?.authType !== "none" && <label>{selected?.authType === "connection_string" ? "Connection string" : selected?.authType === "api_key" ? "API key" : "OAuth access token"}<input type="password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder={process.env.NODE_ENV === "development" ? "Use “demo” for a simulated connection" : "Stored encrypted"} /></label>}
        {error && <div className="form-message error">{error}</div>}
        <div className="dialog-actions"><Dialog.Close className="button button-secondary">Cancel</Dialog.Close><button className="button button-primary" disabled={loading === "connect" || !name || (selected?.authType !== "none" && !credential)} onClick={connect}>{loading === "connect" ? <Loader2 className="spin" size={14} /> : <Plug size={14} />} Connect and test</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </div>;
}
