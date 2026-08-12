"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang, useT } from "@/components/i18n";
import { copy, focusKeys, teamSizes, type FocusKey } from "@/components/landing-copy";

/**
 * The same three questions the landing page shows, in the same order, with
 * the same wording — the questions, the options and the resulting template
 * all come from the landing dictionary rather than a second copy of them.
 *
 * That is the point of this screen: someone who read "три ответа, и он
 * готов" should meet exactly three answers here, and then see the template
 * the site showed them. A fourth question would make the homepage a lie.
 *
 * The answers are stored in the fields that already exist — the focus goes
 * into `department`, the team size into `companySize` — so nothing needs a
 * database migration. The tools question is gone; channels are chosen later,
 * on the channels screen, where they can actually be connected.
 */
export function OnboardingForm({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const { lang } = useLang();
  const t = useT();
  const c = copy[lang].builder;

  const [task, setTask] = useState("");
  const [team, setTeam] = useState<string>(teamSizes[0]);
  const [focus, setFocus] = useState<FocusKey>("replies");
  const [loading, setLoading] = useState(false);

  const steps = c.plans[focus];

  async function finish() {
    setLoading(true);
    const response = await fetch("/api/workspaces/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ department: focus, tools: [], companySize: team, outcome: task })
    });
    setLoading(false);
    if (response.ok) router.push(task ? `/app/outcomes/new?prompt=${encodeURIComponent(task)}` : "/app");
  }

  return <div className="onboarding">
    <header>
      <div className="onboarding-progress"><span className="active" /><span className="active" /><span className="active" /></div>
      <span>{t("onb.setup")}</span>
    </header>

    <div className="onboarding-card">
      <div className="onboarding-icon"><Sparkles size={21} /></div>
      <span className="page-eyebrow">{t("onb.welcome")} {workspaceName.toUpperCase()}</span>
      <h1>{t("onb.title1")}<br />{t("onb.title2")}</h1>
      <p>{t("onb.lead")}</p>

      <div className="onboarding-fields">
        <label>
          {c.step1}
          <textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder={c.examples[0]} />
          <small className="field-hint">{c.step1Hint}</small>
        </label>

        <label>
          {c.step2}
          <div className="option-grid size-options">
            {teamSizes.map((item) => (
              <button type="button" className={team === item ? "selected" : ""} onClick={() => setTeam(item)} key={item}>{item}</button>
            ))}
          </div>
        </label>

        <label>
          {c.step3}
          <div className="option-grid">
            {focusKeys.map((item) => (
              <button type="button" className={focus === item ? "selected" : ""} onClick={() => setFocus(item)} key={item}>
                {focus === item && <Check size={13} />}{c.focus[item]}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* The template is shown before the button, not after it — the promise
          was "three answers and it's ready", so it has to be visible here. */}
      <div className="onboarding-preview">
        <span className="page-eyebrow">{c.resultKicker}</span>
        <ol>{steps.map((step, index) => <li key={step}><i>{index + 1}</i><span>{step}</span></li>)}</ol>
        <small>{c.resultNote}</small>
      </div>

      <button className="button button-primary onboarding-submit" disabled={loading} onClick={finish}>
        {loading ? t("common.saving") : task ? t("onb.build") : t("onb.skip")} <ArrowRight size={15} />
      </button>
    </div>
  </div>;
}
