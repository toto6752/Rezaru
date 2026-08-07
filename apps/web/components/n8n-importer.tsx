"use client";

import type { N8nImportReport } from "@rezaru/workflow-schema";
import { AlertTriangle, ArrowRight, Check, FileJson, Loader2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function N8nImporter() {
  const router = useRouter();
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
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Analysis failed");
      setReport(body.data);
    } catch (caught) {
      setError(caught instanceof SyntaxError ? "The pasted content is not valid JSON." : caught instanceof Error ? caught.message : "Analysis failed");
    } finally { setLoading(""); }
  }

  async function convert() {
    setLoading("convert");
    const response = await fetch("/api/import/n8n/convert", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflow: JSON.parse(source) }) });
    const body = await response.json() as { data?: { outcomeId: string }; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) { setError(body.error?.message ?? "Conversion failed"); return; }
    router.push(`/app/outcomes/${body.data.outcomeId}`);
  }

  function upload(file?: File) {
    if (!file) return;
    if (file.size > 5_000_000) { setError("The n8n export must be smaller than 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setSource(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return <div className="import-page">
    <header className="page-header"><div><span className="page-eyebrow">SAFE MIGRATION</span><h1>Import from n8n</h1><p>Analyze compatibility, map credentials, and test the converted outcome before activation.</p></div></header>
    {!report ? <div className="import-grid">
      <section className="dashboard-panel import-source">
        <div className="import-methods"><label><Upload size={16} /> Upload JSON<input type="file" accept=".json,application/json" onChange={(event) => upload(event.target.files?.[0])} /></label><span>or paste the export below</span></div>
        <textarea value={source} onChange={(event) => setSource(event.target.value)} placeholder={'{\n  "name": "My n8n workflow",\n  "nodes": [...],\n  "connections": {...}\n}'} spellCheck={false} />
        {error && <div className="form-message error">{error}</div>}
        <button className="button button-primary" disabled={!source.trim() || loading === "analyze"} onClick={analyze}>{loading === "analyze" ? <Loader2 className="spin" size={15} /> : <FileJson size={15} />} Analyze compatibility</button>
      </section>
      <aside className="import-safety"><h2>What happens next</h2>{["We detect every exported node", "Supported nodes map to approved operations", "Partial nodes are highlighted for review", "Unsupported code becomes a safe placeholder", "The original JSON is preserved", "Nothing runs until you test and activate"].map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p></div>)}</aside>
    </div> : <section className="compat-report">
      <div className="report-summary dashboard-panel">
        <div><span className="report-file"><FileJson size={19} /></span><div><span>N8N COMPATIBILITY REPORT</span><h2>{report.workflowName}</h2><p>{report.totalNodes} nodes analyzed</p></div></div>
        <div className="score-ring"><strong>{Math.round(((report.supportedNodes + report.partiallySupportedNodes * .5) / report.totalNodes) * 100)}%</strong><span>convertible</span></div>
      </div>
      <div className="report-counts"><article className="success"><Check size={18} /><b>{report.supportedNodes}</b><span>Supported</span></article><article className="warning"><AlertTriangle size={18} /><b>{report.partiallySupportedNodes}</b><span>Partial</span></article><article className="danger"><X size={18} /><b>{report.unsupportedNodes}</b><span>Manual review</span></article></div>
      <div className="dashboard-panel report-nodes"><div className="table-head"><span>Node</span><span>n8n type</span><span>Rezaru operation</span><span>Compatibility</span></div>{report.nodes.map((node) => <div key={`${node.name}-${node.sourceType}`}><b>{node.name}</b><code>{node.sourceType}</code><span>{node.outcomeOperation ?? "Manual review placeholder"}</span><i className={node.compatibility}>{node.compatibility}</i>{node.note && <small>{node.note}</small>}</div>)}</div>
      <div className="report-warnings">{report.warnings.map((warning) => <p key={warning}><AlertTriangle size={14} />{warning}</p>)}</div>
      <div className="report-actions"><button className="button button-secondary" onClick={() => setReport(null)}>Back to source</button><button className="button button-primary" onClick={convert} disabled={loading === "convert"}>{loading === "convert" ? <Loader2 className="spin" size={15} /> : null} Convert to draft outcome <ArrowRight size={15} /></button></div>
    </section>}
  </div>;
}
