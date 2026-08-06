"use client";

import { Check, Copy, Eye, Loader2, ShieldCheck, Webhook } from "lucide-react";
import { useState } from "react";

type Outcome = { id: string; name: string };
type Endpoint = { id: string; outcomeId: string; pathPrefix: string; mode: string; enabled: boolean; samplePayload: unknown; createdAt: string | Date; outcome: { name: string } };

export function WebhookManager({ outcomes, initialEndpoints }: { outcomes: Outcome[]; initialEndpoints: Endpoint[] }) {
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [outcomeId, setOutcomeId] = useState(outcomes[0]?.id ?? "");
  const [mode, setMode] = useState("test");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/webhooks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ outcomeId, mode, secret: secret || undefined }) });
    const body = await response.json() as { data?: { id: string; url: string; mode: string } };
    setLoading(false);
    if (body.data) {
      setCreatedUrl(body.data.url);
      const outcome = outcomes.find((item) => item.id === outcomeId)!;
      setEndpoints((current) => [{ id: body.data!.id, outcomeId, pathPrefix: body.data!.url.split("/").at(-1)!.slice(0, 8), mode, enabled: true, samplePayload: null, createdAt: new Date().toISOString(), outcome }, ...current]);
    }
  }
  return <div className="webhook-page">
    {createdUrl && <div className="raw-key-banner"><div><Webhook size={18} /><span><b>Copy this webhook URL now</b><p>The full token will not be shown again.</p></span></div><code>{createdUrl}</code><button onClick={() => { void navigator.clipboard.writeText(createdUrl); setCopied(true); }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div>}
    <div className="webhook-grid">
      <section className="dashboard-panel webhook-list"><div className="panel-heading"><div><h2>Webhook endpoints</h2><p>Test endpoints simulate executions; production endpoints require an active outcome.</p></div></div>{endpoints.length ? endpoints.map((endpoint) => <div className="webhook-row" key={endpoint.id}><span><Webhook size={15} /></span><div><b>{endpoint.outcome.name}</b><code>/api/hooks/{endpoint.pathPrefix}••••••</code><small>Created {new Date(endpoint.createdAt).toLocaleDateString()}</small></div><i className={endpoint.mode}>{endpoint.mode}</i>{Boolean(endpoint.samplePayload) && <span className="sample-captured"><Eye size={12} /> Sample captured</span>}</div>) : <p className="aside-empty">No webhook endpoints yet.</p>}</section>
      <aside className="dashboard-panel create-webhook"><Webhook size={20} /><h2>Create endpoint</h2><p>The unguessable URL is shown once. Optionally require an additional secret header.</p><form onSubmit={create}><label>Outcome<select value={outcomeId} onChange={(event) => setOutcomeId(event.target.value)}>{outcomes.map((outcome) => <option value={outcome.id} key={outcome.id}>{outcome.name}</option>)}</select></label><label>Mode<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="test">Test — simulated</option><option value="production">Production — real execution</option></select></label><label>Verification secret (optional)<input type="password" minLength={16} value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Sent as x-outcomeos-secret" /></label><button className="button button-primary" disabled={loading || !outcomeId}>{loading ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />} Create secure endpoint</button></form></aside>
    </div>
  </div>;
}
