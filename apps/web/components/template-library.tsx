"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, Clock3, Loader2, Plug, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Template = {
  id: string;
  title: string;
  description: string;
  department: string;
  useCase: string;
  requiredIntegrations: string[];
  setupMinutes: number;
  monthlyMinutesSaved: number;
  configurableVariables: Record<string, { label: string; type: string; default: string | number }>;
};

export function TemplateLibrary({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [selected, setSelected] = useState<Template | null>(null);
  const [variables, setVariables] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const departments = ["All", ...new Set(templates.map((template) => template.department))];
  const filtered = useMemo(() => templates.filter((template) =>
    (department === "All" || template.department === department) &&
    `${template.title} ${template.description} ${template.useCase}`.toLowerCase().includes(search.toLowerCase())
  ), [department, search, templates]);

  function preview(template: Template) {
    setSelected(template);
    setVariables(Object.fromEntries(Object.entries(template.configurableVariables).map(([key, config]) => [key, config.default])));
    setError("");
  }

  async function install() {
    if (!selected) return;
    setLoading(true);
    const response = await fetch(`/api/templates/${selected.id}/install`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variables })
    });
    const body = await response.json() as { data?: { outcomeId: string }; error?: { message?: string } };
    setLoading(false);
    if (!response.ok || !body.data) { setError(body.error?.message ?? "Installation failed"); return; }
    router.push(`/app/outcomes/${body.data.outcomeId}`);
  }

  return <div className="templates-page">
    <header className="page-header"><div><span className="page-eyebrow">OUTCOME MARKETPLACE</span><h1>Templates</h1><p>Start with a proven business outcome and configure only what is specific to your team.</p></div></header>
    <div className="template-tools"><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search outcome templates…" /></div><div>{departments.map((item) => <button className={department === item ? "active" : ""} onClick={() => setDepartment(item)} key={item}>{item}</button>)}</div></div>
    <div className="library-grid">{filtered.map((template) => <article key={template.id}><div className="template-top"><span>{template.department}</span><Sparkles size={16} /></div><h2>{template.title}</h2><p>{template.description}</p><div className="template-integrations">{template.requiredIntegrations.slice(0, 4).map((integration) => <span key={integration}><Plug size={11} />{integration.replace("_", " ")}</span>)}</div><footer><span><Clock3 size={13} /> {template.setupMinutes} min setup</span><b>Saves {Math.round(template.monthlyMinutesSaved / 60)}h/mo</b><button onClick={() => preview(template)} aria-label={`Preview ${template.title}`}><ArrowRight size={15} /></button></footer></article>)}</div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content template-dialog"><Dialog.Close className="dialog-close"><X size={17} /></Dialog.Close><span className="page-eyebrow">{selected?.department}</span><Dialog.Title>{selected?.title}</Dialog.Title><Dialog.Description>{selected?.description}</Dialog.Description>
      <div className="template-preview-meta"><span><Clock3 size={14} /> {selected?.setupMinutes} minutes to configure</span><span><Sparkles size={14} /> Saves ~{Math.round((selected?.monthlyMinutesSaved ?? 0) / 60)} hours / month</span></div>
      <div className="template-preview-connections"><b>Required connections</b>{selected?.requiredIntegrations.map((integration) => <span key={integration}><Plug size={13} />{integration.replace("_", " ")}</span>)}</div>
      {Object.entries(selected?.configurableVariables ?? {}).map(([key, config]) => <label key={key}>{config.label}<input type={config.type === "number" ? "number" : "text"} value={variables[key] ?? ""} onChange={(event) => setVariables((current) => ({ ...current, [key]: config.type === "number" ? Number(event.target.value) : event.target.value }))} /></label>)}
      {error && <div className="form-message error">{error}</div>}
      <div className="dialog-actions"><Dialog.Close className="button button-secondary">Cancel</Dialog.Close><button className="button button-primary" onClick={install} disabled={loading}>{loading ? <Loader2 className="spin" size={14} /> : <Check size={14} />} Install as draft</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
