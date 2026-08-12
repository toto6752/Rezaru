"use client";

import { Check, CreditCard, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/i18n";
import type { UiCopyKey } from "@/components/ui-copy";

/**
 * The plans exactly as the pricing page sells them.
 *
 * `key` is the database enum and never changes; `name` is what an owner
 * reads. The two were the same thing before, which is why the site offered
 * Старт at 29 and the product then showed PRO at $39 — the same plan under
 * two names at two prices.
 *
 * FREE is the 14-day trial, so it is not a card in the grid: nobody chooses
 * it, everybody starts on it.
 */
type Plan = {
  key: "PRO" | "TEAM" | "BUSINESS";
  name: UiCopyKey;
  price: number | null;
  copy: UiCopyKey;
  features: readonly UiCopyKey[];
  highlight?: boolean;
};

const plans: readonly Plan[] = [
  {
    key: "PRO",
    name: "bill.namePro",
    price: 29,
    copy: "bill.proCopy",
    features: ["bill.proF1", "bill.proF2", "bill.proF3", "bill.proF4", "bill.proF5"]
  },
  {
    key: "TEAM",
    name: "bill.nameTeam",
    price: 69,
    copy: "bill.teamCopy",
    features: ["bill.teamF1", "bill.teamF2", "bill.teamF3", "bill.teamF4", "bill.teamF5"],
    highlight: true
  },
  {
    key: "BUSINESS",
    name: "bill.nameBusiness",
    price: null,
    copy: "bill.businessCopy",
    features: ["bill.businessF1", "bill.businessF2", "bill.businessF3", "bill.businessF4"]
  }
];

const planName: Record<string, UiCopyKey> = {
  FREE: "bill.nameFree",
  PRO: "bill.namePro",
  TEAM: "bill.nameTeam",
  BUSINESS: "bill.nameBusiness"
};

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

  const currentName = planName[currentPlan];

  return <div className="billing-content">
    {developmentMode && <div className="development-billing"><Sparkles size={16} /><div><b>{t("bill.devTitle")}</b><p>{t("bill.devCopy")}</p></div></div>}
    {message && <div className="form-message success">{message}</div>}

    <div className="billing-current">
      <div>
        <span>{t("bill.current")}</span>
        <h2>{currentName ? t(currentName) : currentPlan}</h2>
        <p>{currentPlan === "FREE" ? t("bill.trialNote") : developmentMode ? t("bill.localSub") : t("bill.stripeSub")}</p>
      </div>
      <button className="button button-secondary" onClick={portal} disabled={loading === "portal"}>{loading === "portal" ? <Loader2 className="spin" size={14} /> : <CreditCard size={14} />} {t("bill.manageSub")}</button>
    </div>

    <div className="billing-toggle">
      <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>{t("bill.monthly")}</button>
      <button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>{t("bill.annual")} <span>{t("bill.save20")}</span></button>
    </div>

    <div className="billing-plan-grid">{plans.map((plan) => {
      const current = plan.key === currentPlan;
      return <article className={current ? "current" : plan.highlight ? "highlight" : ""} key={plan.key}>
        <span>{current ? t("bill.current") : t("bill.plan")}</span>
        <h3>{t(plan.name)}</h3>
        <p>{t(plan.copy)}</p>
        <div>{plan.price === null
          ? <b className="custom-price">{t("bill.businessPrice")}</b>
          : <><sup>$</sup><b>{annual ? Math.round(plan.price * .8) : plan.price}</b><small>{t("bill.perMonth")}</small></>}</div>
        <ul>{plan.features.map((feature) => <li key={feature}><Check size={13} />{t(feature)}</li>)}</ul>
        {plan.price === null
          ? <a className="button button-secondary" href="mailto:sales@rezaru.dev">{t("bill.contact")}</a>
          : <button className={current ? "button button-secondary" : "button button-primary"} disabled={Boolean(loading) || current} onClick={() => choose(plan.key as "PRO" | "TEAM")}>
              {loading === plan.key ? <Loader2 className="spin" size={14} /> : null}
              {current ? t("bill.currentPlan") : `${t("bill.choose")} «${t(plan.name)}»`}
            </button>}
        {plan.price === null && <small className="plan-note">{t("bill.businessNote")}</small>}
      </article>;
    })}</div>
  </div>;
}
