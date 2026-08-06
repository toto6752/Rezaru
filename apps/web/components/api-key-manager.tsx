"use client";

import { Check, Copy, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

type ApiKey = { id: string; name: string; prefix: string; scopes: string[]; lastUsedAt: string | Date | null; createdAt: string | Date };

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(["outcomes:read", "outcomes:trigger", "executions:read"]);
  const [rawKey, setRawKey] = useState("");
  const [loading, setLoading] = useState("");
  const [copied, setCopied] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading("create");
    const response = await fetch("/api/api-keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, scopes }) });
    const body = await response.json() as { data?: ApiKey & { key: string } };
    setLoading("");
    if (body.data) {
      setKeys((current) => [body.data!, ...current]);
      setRawKey(body.data.key);
      setName("");
    }
  }
  async function revoke(id: string) {
    if (!window.confirm("Revoke this API key? Existing integrations using it will stop working.")) return;
    setLoading(id);
    const response = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setLoading("");
    if (response.ok) setKeys((current) => current.filter((key) => key.id !== id));
  }

  return <div className="api-key-page">
    {rawKey && <div className="raw-key-banner"><div><KeyRound size={18} /><span><b>Copy this key now</b><p>It will not be shown again.</p></span></div><code>{rawKey}</code><button onClick={() => { void navigator.clipboard.writeText(rawKey); setCopied(true); }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div>}
    <div className="api-key-grid">
      <section className="dashboard-panel key-list"><div className="panel-heading"><div><h2>Workspace API keys</h2><p>Only prefixes and hashes are stored.</p></div></div>{keys.length ? keys.map((key) => <div className="key-row" key={key.id}><span><KeyRound size={15} /></span><div><b>{key.name}</b><code>{key.prefix}••••••••</code><small>{key.scopes.join(" · ")}</small></div><time>{key.lastUsedAt ? `Used ${new Date(key.lastUsedAt).toLocaleDateString()}` : "Never used"}</time><button onClick={() => revoke(key.id)} disabled={loading === key.id}><Trash2 size={14} /></button></div>) : <div className="aside-empty">No API keys have been created.</div>}</section>
      <aside className="dashboard-panel create-key"><KeyRound size={20} /><h2>Create API key</h2><p>Use the least privilege needed by the integration.</p><form onSubmit={create}><label>Key name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Production backend" /></label><label>Scopes</label>{["outcomes:read", "outcomes:trigger", "executions:read"].map((scope) => <button type="button" className={scopes.includes(scope) ? "scope selected" : "scope"} onClick={() => setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])} key={scope}>{scopes.includes(scope) && <Check size={12} />}{scope}</button>)}<button className="button button-primary" disabled={loading === "create" || !name || scopes.length === 0}>{loading === "create" ? <Loader2 className="spin" size={14} /> : null} Generate key</button></form></aside>
    </div>
    <section className="dashboard-panel api-docs"><div className="panel-heading"><div><h2>Developer API quickstart</h2><p>Use a bearer token and JSON requests. Rate limits apply per key.</p></div></div><pre>{`curl -X POST ${typeof window === "undefined" ? "http://localhost:3000" : window.location.origin}/api/v1/outcomes/OUTCOME_ID/trigger \\
  -H "Authorization: Bearer oos_..." \\
  -H "Content-Type: application/json" \\
  -d '{"input":{"email":"lead@example.com"},"idempotencyKey":"lead-123"}'`}</pre><div className="endpoint-list"><code>GET /api/v1/outcomes</code><span>List outcomes</span><code>POST /api/v1/outcomes/:id/trigger</code><span>Trigger an outcome</span><code>GET /api/v1/executions</code><span>List executions</span><code>GET /api/v1/executions/:id</code><span>Execution details</span></div></section>
  </div>;
}
