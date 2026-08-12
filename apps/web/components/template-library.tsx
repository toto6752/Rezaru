"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, Clock3, Loader2, Plug, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useT } from "@/components/i18n";
import { BackLink } from "@/components/back-link";

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
  const t = useT();
  const [search, setSearch] = useState("");
  // "All" is the no-filter sentinel; its label comes from the dictionary.
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
    if (!response.ok || !body.data) { setError(body.error?.message ?? t("tpl.installFailed")); return; }
    router.push(`/app/outcomes/${body.data.outcomeId}`);
  }

  return <div className="templates-page">
    <BackLink href="/app/outcomes" labelKey="nav.outcomes" />
    <header className="page-header"><div><span className="page-eyebrow">{t("tpl.eyebrow")}</span><h1>{t("tpl.title")}</h1><p>{t("tpl.lead")}</p></div></header>
    <div className="template-tools"><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("tpl.search")} /></div><div>{departments.map((item) => <button className={department === item ? "active" : ""} onClick={() => setDepartment(item)} key={item}>{item === "All" ? t("tpl.all") : item}</button>)}</div></div>
    <div className="library-grid">{filtered.map((template) => <article key={template.id}><div className="template-top"><span>{template.department}</span><Sparkles size={16} /></div><h2>{template.title}</h2><p>{template.description}</p><div className="template-integrations">{template.requiredIntegrations.slice(0, 4).map((integration) => <span key={integration}><Plug size={11} />{integration.replace("_", " ")}</span>)}</div><footer><span><Clock3 size={13} /> {template.setupMinutes} {t("tpl.setup")}</span><b>{t("tpl.saves")} {Math.round(template.monthlyMinutesSaved / 60)} {t("tpl.savesUnit")}</b><button onClick={() => preview(template)} aria-label={`${t("tpl.preview")}: ${template.title}`}><ArrowRight size={15} /></button></footer></article>)}</div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content template-dialog"><Dialog.Close className="dialog-close"><X size={17} /></Dialog.Close><span className="page-eyebrow">{selected?.department}</span><Dialog.Title>{selected?.title}</Dialog.Title><Dialog.Description>{selected?.description}</Dialog.Description>
      <div className="template-preview-meta"><span><Clock3 size={14} /> {selected?.setupMinutes} {t("tpl.minutes")}</span><span><Sparkles size={14} /> {t("tpl.savesAbout")} {Math.round((selected?.monthlyMinutesSaved ?? 0) / 60)} {t("tpl.hoursMonth")}</span></div>
      <div className="template-preview-connections"><b>{t("tpl.requiredConn")}</b>{selected?.requiredIntegrations.map((integration) => <span key={integration}><Plug size={13} />{integration.replace("_", " ")}</span>)}</div>
      {Object.entries(selected?.configurableVariables ?? {}).map(([key, config]) => <label key={key}>{config.label}<input type={config.type === "number" ? "number" : "text"} value={variables[key] ?? ""} onChange={(event) => setVariables((current) => ({ ...current, [key]: config.type === "number" ? Number(event.target.value) : event.target.value }))} /></label>)}
      {error && <div className="form-message error">{error}</div>}
      <div className="dialog-actions"><Dialog.Close className="button button-secondary">{t("common.cancel")}</Dialog.Close><button className="button button-primary" onClick={install} disabled={loading}>{loading ? <Loader2 className="spin" size={14} /> : <Check size={14} />} {t("tpl.install")}</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
