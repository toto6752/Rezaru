"use client";

import type { N8nImportReport } from "@rezaru/workflow-schema";
import { AlertTriangle, ArrowRight, Check, FileJson, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n";
import { BackLink } from "@/components/back-link";
import type { UiCopyKey } from "@/components/ui-copy";

const steps: readonly UiCopyKey[] = ["imp.next1", "imp.next2", "imp.next3", "imp.next4", "imp.next5", "imp.next6"];

export function N8nImporter() {
  const router = useRouter();
  const t = useT();
  const [source, setSource] = useState("");
  const [report, setReport] = useState<N8nImportReport | null>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function analyze() {
    setError("");
    setLoading("analyze");
    try {
      const workflow = JSON.parse(source);
      const response = await fetch("/api/import/n8n/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflow }) });
      const body = await response.json() as { data?: N8nImportReport; error?: { message?: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? t("imp.analysisFailed"));
      setReport(body.data);
    } catch (caught) {
      setError(caught instanceof SyntaxError ? t("imp.badJson") : caught instanceof Error ? caught.message : t("imp.analysisFailed"));
    } finally { setLoading(""); }
  }

  async function convert() {
    setLoading("convert");
    const response = await fetch("/api/import/n8n/convert", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflow: JSON.parse(source) }) });
    const body = await response.json() as { data?: { outcomeId: string }; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) { setError(body.error?.message ?? t("imp.conversionFailed")); return; }
    router.push(`/app/outcomes/${body.data.outcomeId}`);
  }

  function upload(file?: File) {
    if (!file) return;
    if (file.size > 5_000_000) { setError(t("imp.tooBig")); return; }
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return <div className="import-page">
    <BackLink href="/app/settings" labelKey="set.back" />
    <header className="page-header"><div><span className="page-eyebrow">{t("imp.eyebrow")}</span><h1>{t("imp.title")}</h1><p>{t("imp.lead")}</p></div></header>
    {!report ? <div className="import-grid">
      <section className="dashboard-panel import-source">
        <div className="import-methods"><label><Upload size={16} /> {t("imp.upload")}<input type="file" accept=".json,application/json" onChange={(event) => upload(event.target.files?.[0])} /></label><span>{t("imp.orPaste")}</span></div>
        <textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={'{\n  "name": "...",\n  "nodes": [...],\n  "connections": {...}\n}'} spellCheck={false} />
        {error && <div className="form-message error">{error}</div>}
        <button className="button button-primary" disabled={!source.trim() || loading === "analyze"} onClick={analyze}>{loading === "analyze" ? <Loader2 className="spin" size={15} /> : <FileJson size={15} />} {t("imp.analyze")}</button>
      </section>
      <aside className="import-safety"><h2>{t("imp.next")}</h2>{steps.map((key, index) => <div key={key}><span>{index + 1}</span><p>{t(key)}</p></div>)}</aside>
    </div> : <section className="compat-report">
      <div className="report-summary dashboard-panel">
        <div><span className="report-file"><FileJson size={19} /></span><div><span>{t("imp.report")}</span><h2>{report.workflowName}</h2><p>{report.totalNodes} {t("imp.nodesAnalyzed")}</p></div></div>
        <div className="score-ring"><strong>{Math.round(((report.supportedNodes + report.partiallySupportedNodes * .5) / report.totalNodes) * 100)}%</strong><span>{t("imp.convertible")}</span></div>
      </div>
      <div className="report-counts"><article className="success"><Check size={18} /><b>{report.supportedNodes}</b><span>{t("imp.supported")}</span></article><article className="warning"><AlertTriangle size={18} /><b>{report.partiallySupportedNodes}</b><span>{t("imp.partial")}</span></article><article className="danger"><X size={18} /><b>{report.unsupportedNodes}</b><span>{t("imp.manual")}</span></article></div>
      <div className="dashboard-panel report-nodes"><div className="table-head"><span>{t("imp.colNode")}</span><span>{t("imp.colType")}</span><span>{t("imp.colOperation")}</span><span>{t("imp.colCompat")}</span></div>{report.nodes.map((node) => <div key={`${node.name}-${node.sourceType}`}><b>{node.name}</b><code>{node.sourceType}</code><span>{node.outcomeOperation ?? t("imp.placeholder")}</span><i className={node.compatibility}>{node.compatibility}</i>{node.note && <small>{node.note}</small>}</div>)}</div>
      <div className="report-warnings">{report.warnings.map((warning) => <p key={warning}><AlertTriangle size={14} />{warning}</p>)}</div>
      <div className="report-actions"><button className="button button-secondary" onClick={() => setReport(null)}>{t("imp.backToSource")}</button><button className="button button-primary" onClick={convert} disabled={loading === "convert"}>{loading === "convert" ? <Loader2 className="spin" size={15} /> : null} {t("imp.convert")} <ArrowRight size={15} /></button></div>
    </section>}
  </div>;
}
