"use client";

import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

type Plan = { name: string; price: number; copy: UiCopyKey; features: readonly UiCopyKey[] };

const plans: readonly Plan[] = [
  { name: "FREE", price: 0, copy: "bill.freeCopy", features: ["bill.freeF1", "bill.freeF2", "bill.freeF3"] },
  { name: "PRO", price: 39, copy: "bill.proCopy", features: ["bill.proF1", "bill.proF2", "bill.proF3"] },
  { name: "TEAM", price: 149, copy: "bill.teamCopy", features: ["bill.teamF1", "bill.teamF2", "bill.teamF3"] }
];

export function BillingPlans({ currentPlan, developmentMode }: { currentPlan: string; developmentMode: boolean }) {
  const router = useRouter();
  const t = useT();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  async function choose(plan: "PRO" | "TEAM") {
    setLoading(plan);
    const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, interval: annual ? "annual" : "monthly" }) });
    const body = await response.json() as { data?: { url?: string; message?: string; developmentMode?: boolean }; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) { setMessage(body.error?.message ?? t("bill.failed")); return; }
    if (body.data.url) window.location.assign(body.data.url);
    else { setMessage(body.data.message ?? t("bill.updated")); router.refresh(); }
  }
  async function portal() {
    setLoading("portal");
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const body = await response.json() as { data?: { url?: string; message?: string } };
    setLoading("");
    if (body.data?.url) window.location.assign(body.data.url);
    else setMessage(body.data?.message ?? t("bill.portalUnavailable"));
  }
  return <div className="billing-content">
    {developmentMode && <div className="development-billing"><Sparkles size={16} /><div><b>{t("bill.devTitle")}</b><p>{t("bill.devCopy")}</p></div></div>}
    {message && <div className="form-message success">{message}</div>}
    <div className="billing-current"><div><span>{t("bill.current")}</span><h2>{currentPlan}</h2><p>{developmentMode ? t("bill.localSub") : t("bill.stripeSub")}</p></div><button className="button button-secondary" onClick={portal} disabled={loading === "portal"}>{loading === "portal" ? <Loader2 className="spin" size={14} /> : <CreditCard size={14} />} {t("bill.manageSub")}</button></div>
    <div className="billing-toggle"><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>{t("bill.monthly")}</button><button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>{t("bill.annual")} <span>{t("bill.save20")}</span></button></div>
    <div className="billing-plan-grid">{plans.map((plan) => <article className={plan.name === currentPlan ? "current" : ""} key={plan.name}><span>{plan.name === currentPlan ? t("bill.current") : t("bill.plan")}</span><h3>{plan.name}</h3><p>{t(plan.copy)}</p><div>{plan.price ? <><sup>$</sup><b>{annual ? Math.round(plan.price * .8) : plan.price}</b><small>{t("bill.perMonth")}</small></> : <b>$0</b>}</div><ul>{plan.features.map((feature) => <li key={feature}><Check size={13} />{t(feature)}</li>)}</ul>{plan.name === "FREE" ? <button className="button button-secondary" disabled>{t("bill.included")}</button> : <button className={plan.name === currentPlan ? "button button-secondary" : "button button-primary"} disabled={Boolean(loading) || plan.name === currentPlan} onClick={() => choose(plan.name as "PRO" | "TEAM")}>{loading === plan.name ? <Loader2 className="spin" size={14} /> : null}{plan.name === currentPlan ? t("bill.currentPlan") : `${t("bill.choose")} ${plan.name}`}</button>}</article>)}</div>
    <div className="business-plan"><div><span>BUSINESS</span><h3>{t("bill.businessTitle")}</h3></div><a className="button button-secondary" href="mailto:sales@rezaru.dev">{t("bill.contact")}</a></div>
  </div>;
}
