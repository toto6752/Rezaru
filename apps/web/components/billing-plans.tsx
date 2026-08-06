"use client";

import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function BillingPlans({ currentPlan, developmentMode }: { currentPlan: string; developmentMode: boolean }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  async function choose(plan: "PRO" | "TEAM") {
    setLoading(plan);
    const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan, interval: annual ? "annual" : "monthly" }) });
    const body = await response.json() as { data?: { url?: string; message?: string; developmentMode?: boolean }; error?: { message?: string } };
    setLoading("");
    if (!response.ok || !body.data) { setMessage(body.error?.message ?? "Billing action failed"); return; }
    if (body.data.url) window.location.assign(body.data.url);
    else { setMessage(body.data.message ?? "Plan updated"); router.refresh(); }
  }
  async function portal() {
    setLoading("portal");
    const response = await fetch("/api/stripe/portal", { method: "POST" });
    const body = await response.json() as { data?: { url?: string; message?: string } };
    setLoading("");
    if (body.data?.url) window.location.assign(body.data.url);
    else setMessage(body.data?.message ?? "Customer portal unavailable");
  }
  const plans = [
    { name: "FREE", price: 0, copy: "For proving the first outcomes", features: ["3 active outcomes", "500 executions", "Basic integrations"] },
    { name: "PRO", price: 39, copy: "For operators automating real work", features: ["20 active outcomes", "10,000 executions", "AI builder and n8n import"] },
    { name: "TEAM", price: 149, copy: "For shared operational ownership", features: ["100 active outcomes", "50,000 executions", "Approvals and shared connections"] }
  ];
  return <div className="billing-content">
    {developmentMode && <div className="development-billing"><Sparkles size={16} /><div><b>Development billing mode</b><p>Stripe credentials are not configured. Plan changes update local limits and never create a charge.</p></div></div>}
    {message && <div className="form-message success">{message}</div>}
    <div className="billing-current"><div><span>CURRENT PLAN</span><h2>{currentPlan}</h2><p>{developmentMode ? "Local development subscription" : "Managed securely through Stripe"}</p></div><button className="button button-secondary" onClick={portal} disabled={loading === "portal"}>{loading === "portal" ? <Loader2 className="spin" size={14} /> : <CreditCard size={14} />} Manage subscription</button></div>
    <div className="billing-toggle"><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button><button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual <span>Save 20%</span></button></div>
    <div className="billing-plan-grid">{plans.map((plan) => <article className={plan.name === currentPlan ? "current" : ""} key={plan.name}><span>{plan.name === currentPlan ? "CURRENT PLAN" : "PLAN"}</span><h3>{plan.name}</h3><p>{plan.copy}</p><div>{plan.price ? <><sup>$</sup><b>{annual ? Math.round(plan.price * .8) : plan.price}</b><small>/month</small></> : <b>$0</b>}</div><ul>{plan.features.map((feature) => <li key={feature}><Check size={13} />{feature}</li>)}</ul>{plan.name === "FREE" ? <button className="button button-secondary" disabled>Included</button> : <button className={plan.name === currentPlan ? "button button-secondary" : "button button-primary"} disabled={Boolean(loading) || plan.name === currentPlan} onClick={() => choose(plan.name as "PRO" | "TEAM")}>{loading === plan.name ? <Loader2 className="spin" size={14} /> : null}{plan.name === currentPlan ? "Current plan" : `Choose ${plan.name}`}</button>}</article>)}</div>
    <div className="business-plan"><div><span>BUSINESS</span><h3>Private cloud, SSO, custom limits, and an SLA.</h3></div><a className="button button-secondary" href="mailto:sales@outcomeos.dev">Contact sales</a></div>
  </div>;
}
