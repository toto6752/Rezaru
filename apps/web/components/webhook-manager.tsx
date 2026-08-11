"use client";

import { Check, Copy, Eye, Loader2, ShieldCheck, Webhook } from "lucide-react";
import { useState } from "react";
import { LocalDate, useT } from "@/components/i18n";

type Outcome = { id: string; name: string };
type Endpoint = { id: string; outcomeId: string; pathPrefix: string; mode: string; enabled: boolean; samplePayload: unknown; createdAt: string | Date; outcome: { name: string } };

export function WebhookManager({ outcomes, initialEndpoints }: { outcomes: Outcome[]; initialEndpoints: Endpoint[] }) {
  const t = useT();
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
    {createdUrl && <div className="raw-key-banner"><div><Webhook size={18} /><span><b>{t("hook.copyNow")}</b><p>{t("hook.copyNowSub")}</p></span></div><code>{createdUrl}</code><button onClick={() => { void navigator.clipboard.writeText(createdUrl); setCopied(true); }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? t("common.copied") : t("common.copy")}</button></div>}
    <div className="webhook-grid">
      <section className="dashboard-panel webhook-list"><div className="panel-heading"><div><h2>{t("hook.list")}</h2><p>{t("hook.listSub")}</p></div></div>{endpoints.length ? endpoints.map((endpoint) => <div className="webhook-row" key={endpoint.id}><span><Webhook size={15} /></span><div><b>{endpoint.outcome.name}</b><code>/api/hooks/{endpoint.pathPrefix}••••••</code><small>{t("hook.created")} <LocalDate value={endpoint.createdAt} /></small></div><i className={endpoint.mode}>{endpoint.mode}</i>{Boolean(endpoint.samplePayload) && <span className="sample-captured"><Eye size={12} /> {t("hook.sample")}</span>}</div>) : <p className="aside-empty">{t("hook.none")}</p>}</section>
      <aside className="dashboard-panel create-webhook"><Webhook size={20} /><h2>{t("hook.create")}</h2><p>{t("hook.createSub")}</p><form onSubmit={create}><label>{t("hook.outcome")}<select value={outcomeId} onChange={(event) => setOutcomeId(event.target.value)}>{outcomes.map((outcome) => <option value={outcome.id} key={outcome.id}>{outcome.name}</option>)}</select></label><label>{t("hook.mode")}<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="test">{t("hook.modeTest")}</option><option value="production">{t("hook.modeProd")}</option></select></label><label>{t("hook.secret")}<input type="password" minLength={16} value={secret} onChange={(event) => setSecret(event.target.value)} placeholder={t("hook.secretPlaceholder")} /></label><button className="button button-primary" disabled={loading || !outcomeId}>{loading ? <Loader2 className="spin" size={14} /> : <ShieldCheck size={14} />} {t("hook.createSecure")}</button></form></aside>
    </div>
  </div>;
}
