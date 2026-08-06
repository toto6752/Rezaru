"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const departments = ["Sales", "Marketing", "Finance", "Customer Support", "Operations", "HR", "Engineering"];
const tools = ["Slack", "HubSpot", "Gmail", "Google Sheets", "Notion", "Stripe", "PostgreSQL", "n8n"];
const sizes = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"];

export function OnboardingForm({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const [department, setDepartment] = useState("Operations");
  const [selectedTools, setSelectedTools] = useState<string[]>(["Slack"]);
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
    <header><div className="onboarding-progress"><span className="active" /><span className="active" /><span className="active" /><span /></div><span>Workspace setup</span></header>
    <div className="onboarding-card">
      <div className="onboarding-icon"><Sparkles size={21} /></div>
      <span className="page-eyebrow">WELCOME TO {workspaceName.toUpperCase()}</span>
      <h1>Make OutcomeOS useful<br />from the first run.</h1>
      <p>Tell us a little about your team. We’ll suggest outcomes—not generic workflows.</p>
      <div className="onboarding-fields">
        <label>What do you want to automate?<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder="For example: Route new website leads to our CRM and notify sales." /></label>
        <label>Which department best describes you?<div className="option-grid">{departments.map((item) => <button className={department === item ? "selected" : ""} onClick={() => setDepartment(item)} key={item}>{department === item && <Check size={13} />}{item}</button>)}</div></label>
        <label>Which tools do you use?<div className="option-grid tool-options">{tools.map((item) => <button className={selectedTools.includes(item) ? "selected" : ""} onClick={() => setSelectedTools((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} key={item}>{selectedTools.includes(item) && <Check size={13} />}{item}</button>)}</div></label>
        <label>Company size<div className="option-grid size-options">{sizes.map((item) => <button className={companySize === item ? "selected" : ""} onClick={() => setCompanySize(item)} key={item}>{item}</button>)}</div></label>
      </div>
      <button className="button button-primary onboarding-submit" disabled={loading} onClick={finish}>{loading ? "Saving…" : outcome ? "Build this outcome" : "Show my dashboard"} <ArrowRight size={15} /></button>
    </div>
  </div>;
}
