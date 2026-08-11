"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

/**
 * The stored value stays English because the API and the templates key off it;
 * only the label the owner reads is translated.
 */
const departments: ReadonlyArray<{ value: string; key: UiCopyKey }> = [
  { value: "Sales", key: "onb.deptSales" },
  { value: "Marketing", key: "onb.deptMarketing" },
  { value: "Finance", key: "onb.deptFinance" },
  { value: "Customer Support", key: "onb.deptSupport" },
  { value: "Operations", key: "onb.deptOps" },
  { value: "HR", key: "onb.deptHr" },
  { value: "Engineering", key: "onb.deptEng" }
];
// Product names, so they read the same in both languages.
const tools = ["Telegram", "Instagram", "WhatsApp", "Google Sheets", "Excel", "Notion", "Stripe", "n8n"];
const sizes = ["1–10", "11–50", "51–200", "201–1000", "1000+"];

export function OnboardingForm({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const t = useT();
  const [department, setDepartment] = useState("Operations");
  const [selectedTools, setSelectedTools] = useState<string[]>(["Telegram"]);
  const [companySize, setCompanySize] = useState("11–50");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    const response = await fetch("/api/workspaces/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ department, tools: selectedTools, companySize, outcome })
    });
    setLoading(false);
    if (response.ok) router.push(outcome ? `/app/outcomes/new?prompt=${encodeURIComponent(outcome)}` : "/app");
  }

  return <div className="onboarding">
    <header><div className="onboarding-progress"><span className="active" /><span className="active" /><span className="active" /><span /></div><span>{t("onb.setup")}</span></header>
    <div className="onboarding-card">
      <div className="onboarding-icon"><Sparkles size={21} /></div>
      <span className="page-eyebrow">{t("onb.welcome")} {workspaceName.toUpperCase()}</span>
      <h1>{t("onb.title1")}<br />{t("onb.title2")}</h1>
      <p>{t("onb.lead")}</p>
      <div className="onboarding-fields">
        <label>{t("onb.what")}<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder={t("onb.whatPlaceholder")} /></label>
        <label>{t("onb.dept")}<div className="option-grid">{departments.map((item) => <button className={department === item.value ? "selected" : ""} onClick={() => setDepartment(item.value)} key={item.value}>{department === item.value && <Check size={13} />}{t(item.key)}</button>)}</div></label>
        <label>{t("onb.tools")}<div className="option-grid tool-options">{tools.map((item) => <button className={selectedTools.includes(item) ? "selected" : ""} onClick={() => setSelectedTools((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} key={item}>{selectedTools.includes(item) && <Check size={13} />}{item}</button>)}</div></label>
        <label>{t("onb.size")}<div className="option-grid size-options">{sizes.map((item) => <button className={companySize === item ? "selected" : ""} onClick={() => setCompanySize(item)} key={item}>{item}</button>)}</div></label>
      </div>
      <button className="button button-primary onboarding-submit" disabled={loading} onClick={finish}>{loading ? t("common.saving") : outcome ? t("onb.build") : t("onb.skip")} <ArrowRight size={15} /></button>
    </div>
  </div>;
}
