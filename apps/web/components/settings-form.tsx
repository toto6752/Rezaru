"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/i18n";

export function SettingsForm({ workspace }: { workspace: { name: string; department: string | null; companySize: string | null; slug: string } }) {
  const t = useT();
  const [name, setName] = useState(workspace.name);
  const [department, setDepartment] = useState(workspace.department ?? "");
  const [companySize, setCompanySize] = useState(workspace.companySize ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setSaved(false);
    const response = await fetch("/api/workspaces/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, department, companySize }) });
    setLoading(false); setSaved(response.ok);
  }
  return <form className="settings-form dashboard-panel" onSubmit={save}><div className="panel-heading"><div><h2>{t("set.details")}</h2><p>{t("set.detailsSub")}</p></div></div><label>{t("set.name")}<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>{t("set.slug")}<input value={workspace.slug} disabled /></label><label>{t("set.dept")}<input value={department} onChange={(event) => setDepartment(event.target.value)} /></label><label>{t("set.size")}<input value={companySize} onChange={(event) => setCompanySize(event.target.value)} /></label><button className="button button-primary" disabled={loading}>{loading ? <Loader2 className="spin" size={14} /> : saved ? <Check size={14} /> : null}{saved ? t("common.saved") : t("set.saveSettings")}</button></form>;
}
