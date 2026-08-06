"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Braces, Check, ChevronDown, Clock3,
  GitBranch, Import, LifeBuoy, LockKeyhole, MessageSquare,
  Play, RefreshCw, ShieldCheck, Sparkles, TimerReset, Users2, Webhook, X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Logo } from "./logo";

const demoExamples = [
  {
    label: "Route new leads",
    prompt: "When a new lead arrives, enrich it, add it to HubSpot, and notify #sales in Slack.",
    steps: ["Receive and validate the lead", "Enrich company information", "Create or update HubSpot contact", "Notify #sales in Slack", "Record the result"]
  },
  {
    label: "Review invoices",
    prompt: "Check invoices over $5,000 for anomalies and ask finance for approval.",
    steps: ["Receive the invoice", "Check the $5,000 threshold", "Analyze unusual details", "Request finance approval", "Record the decision"]
  },
  {
    label: "Weekly sales brief",
    prompt: "Every Monday, summarize sales performance and email the CEO.",
    steps: ["Run Monday at 9:00 AM", "Query sales metrics", "Calculate week-over-week changes", "Write an executive summary", "Email the report"]
  }
];

const features = [
  [Sparkles, "AI Outcome Builder", "Turn a plain-language objective into a validated, executable plan."],
  [RefreshCw, "Self-healing automations", "Detect recurring failures and propose a safer fix for approval."],
  [LifeBuoy, "Plain-language debugging", "Understand what failed, why it matters, and what to do next."],
  [Import, "n8n workflow importer", "Translate supported nodes and clearly flag what needs review."],
  [TimerReset, "Execution monitoring", "Follow every run, retry, pause, cost, and output in one timeline."],
  [LockKeyhole, "Secure credentials", "Keep encrypted connection secrets out of browsers and logs."],
  [Users2, "Team workspaces", "Use role-based access for builders, operators, approvers, and viewers."],
  [Braces, "Reusable templates", "Start from business outcomes—not generic node recipes."],
  [BadgeCheck, "Human approval steps", "Pause sensitive actions until the right person approves them."],
  [Webhook, "Webhooks and API", "Trigger outcomes from your product with signed endpoints and API keys."]
];

const templates = [
  ["Sales", "Qualify and route inbound leads", "HubSpot · Slack", "4 hrs / week"],
  ["Finance", "Process high-value invoices", "Stripe · AI · Approvals", "6 hrs / week"],
  ["Support", "Triage customer support requests", "Gmail · Notion · AI", "8 hrs / week"],
  ["Operations", "Onboard a new employee", "Google Sheets · Gmail", "3 hrs / hire"],
  ["Revenue", "Recover failed payments", "Stripe · Gmail · HubSpot", "5 hrs / week"],
  ["Marketing", "Monitor important company mentions", "HTTP · Slack · AI", "2 hrs / week"]
];

const faqs = [
  ["How is OutcomeOS different from n8n?", "n8n starts from a workflow canvas. OutcomeOS starts from the business result, creates the technical workflow for you, and keeps it healthy. Developers can still inspect the generated flow."],
  ["Can I import my existing workflows?", "Yes. Upload an n8n JSON export to get a compatibility report, credential mapping, converted plan, and a safe test before activation."],
  ["Do I still control what the automation does?", "Always. You review the plan before activation, sensitive changes require approval, and every active workflow version is immutable and auditable."],
  ["What happens when an execution fails?", "OutcomeOS retries safe failures, preserves step-level evidence, explains the error in plain language, and can propose a repair for your approval."],
  ["How are credentials protected?", "Connection credentials are encrypted with authenticated encryption, stored separately from metadata, masked in logs, and never returned to the browser."],
  ["Can OutcomeOS run inside our infrastructure?", "The Business plan supports private cloud and self-hosted deployment patterns. The repository includes a web service, durable worker, PostgreSQL, Redis, and S3-compatible storage."],
  ["Which applications are supported?", "The starter connector set includes webhook, schedule, HTTP, Slack, Gmail, Sheets, PostgreSQL, AI, Notion, Stripe, HubSpot, delay, conditions, and transformations."],
  ["Can developers inspect the generated workflow?", "Yes. A read-only technical flow and versioned JSON representation are available behind the outcome-first plan."]
];

export function LandingPage() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoPrompt, setDemoPrompt] = useState(demoExamples[0]!.prompt);
  const [generated, setGenerated] = useState(true);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const currentDemo = useMemo(
    () => demoExamples.find((example) => example.prompt === demoPrompt) ?? {
      label: "Custom outcome",
      prompt: demoPrompt,
      steps: ["Understand the requested outcome", "Validate business inputs", "Connect the required tools", "Run the work reliably", "Record and monitor the result"]
    },
    [demoPrompt]
  );

  const generate = () => {
    setGenerated(false);
    window.setTimeout(() => setGenerated(true), 450);
  };

  const chooseExample = (index: number) => {
    setDemoIndex(index);
    setDemoPrompt(demoExamples[index]!.prompt);
    setGenerated(false);
    window.setTimeout(() => setGenerated(true), 260);
  };

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo />
          <nav aria-label="Primary navigation">
            <a href="#product">Product</a>
            <a href="#how">How it works</a>
            <a href="#templates">Templates</a>
            <a href="#migration">Migration</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="nav-actions">
            <Link className="nav-signin" href="/login">Sign in</Link>
            <Link className="button button-primary button-small" href="/register">Start free <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="product">
          <div className="eyebrow"><span className="eyebrow-dot" /> Automation without workflows</div>
          <h1>Describe the outcome.<br /><em>AI builds the automation.</em></h1>
          <p className="hero-copy">OutcomeOS creates, runs, fixes, and improves your business automations. No nodes, no JSON, no workflow engineering.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">Build your first outcome <ArrowRight size={17} /></Link>
            <Link className="button button-secondary button-large" href="/app/import/n8n"><Import size={17} /> Import from n8n</Link>
          </div>
          <p className="hero-note"><Check size={14} /> Free plan · No card required · Demo mode included</p>

          <div className="demo-shell">
            <div className="demo-window-bar">
              <div className="window-dots"><span /><span /><span /></div>
              <span>Outcome Builder</span>
              <div className="demo-live"><span /> AI ready</div>
            </div>
            <div className="demo-layout">
              <div className="demo-compose">
                <div className="demo-compose-label"><Sparkles size={15} /> What should your business do?</div>
                <textarea aria-label="Describe an outcome" value={demoPrompt} onChange={(event) => setDemoPrompt(event.target.value)} />
                <div className="demo-examples">
                  {demoExamples.map((example, index) => (
                    <button key={example.label} className={demoIndex === index ? "active" : ""} onClick={() => chooseExample(index)}>{example.label}</button>
                  ))}
                </div>
                <button className="button button-primary demo-generate" onClick={generate}><Sparkles size={16} /> Generate plan</button>
              </div>
              <div className="demo-plan">
                <div className="demo-plan-heading">
                  <div><span>GENERATED PLAN</span><h3>{currentDemo.label}</h3></div>
                  <span className="risk-badge"><ShieldCheck size={13} /> Validated</span>
                </div>
                <AnimatePresence mode="wait">
                  {generated ? (
                    <motion.ol key={currentDemo.prompt} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {currentDemo.steps.map((step, index) => (
                        <motion.li key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07 }}>
                          <span>{index + 1}</span><p>{step}</p>{index < currentDemo.steps.length - 1 && <i />}
                        </motion.li>
                      ))}
                    </motion.ol>
                  ) : <div className="plan-loading"><Sparkles size={20} /><p>Designing the safest route…</p></div>}
                </AnimatePresence>
                <div className="demo-connections"><span>Connections</span><div><i>HS</i><i>SL</i><i>AI</i><b>3 ready</b></div></div>
              </div>
            </div>
            <div className="demo-footer">
              <span><Clock3 size={14} /> Estimated setup: 3 minutes</span>
              <span><Play size={14} /> Test with sample data</span>
              <button>Review & activate <ArrowRight size={14} /></button>
            </div>
          </div>
        </section>

        <section className="proof-strip">
          <span>Built for operations teams</span><i />
          <span>Designed for technical reliability</span><i />
          <span>Compatible with your stack</span><i />
          <span>Importable from n8n</span>
        </section>

        <section className="problem-section section">
          <div className="section-kicker">A BETTER ABSTRACTION</div>
          <h2>You should not need to become<br />an automation engineer.</h2>
          <p>Traditional builders expose the machinery. OutcomeOS gives your team a reliable operator that handles it.</p>
          <div className="process-compare">
            <div className="old-process">
              <span>THE OLD PROCESS</span>
              <div>{["Triggers", "Nodes", "Conditions", "JSON", "Debugging", "Maintenance"].map((label, index) => <div key={label}><i>{index + 1}</i>{label}{index < 5 && <ArrowRight size={15} />}</div>)}</div>
              <p><X size={15} /> More time maintaining tools than improving operations</p>
            </div>
            <div className="new-process">
              <span>THE OUTCOMEOS PROCESS</span>
              <div>{["Describe", "Review", "Activate"].map((label, index) => <div key={label}><i>{index + 1}</i>{label}{index < 2 && <ArrowRight size={18} />}</div>)}</div>
              <p><Check size={15} /> AI builds and operates the workflow underneath</p>
            </div>
          </div>
        </section>

        <section className="how-section section" id="how">
          <div className="section-kicker">HOW IT WORKS</div>
          <h2>From intent to reliable operation.</h2>
          <p>Three steps for you. Every technical detail handled behind the scenes.</p>
          <div className="how-grid">
            {[
              [MessageSquare, "01", "Describe the result.", "Say what should happen in business language. OutcomeOS asks only what it truly needs."],
              [GitBranch, "02", "Connect your tools.", "Review the generated plan and securely connect the applications it needs."],
              [Play, "03", "Let OutcomeOS run it.", "Test, activate, and follow every execution while AI watches for improvements."]
            ].map(([Icon, number, title, copy]) => {
              const IconComponent = Icon as typeof MessageSquare;
              return <div className="how-card" key={String(number)}><span>{String(number)}</span><IconComponent size={24} /><h3>{String(title)}</h3><p>{String(copy)}</p></div>;
            })}
          </div>
        </section>

        <section className="feature-section section">
          <div className="section-heading-row"><div><div className="section-kicker">BUILT TO OPERATE</div><h2>Everything between intent and outcome.</h2></div><p>The expressive power of a workflow platform, without forcing every user to think like a workflow engineer.</p></div>
          <div className="feature-grid">
            {features.map(([Icon, title, copy]) => {
              const IconComponent = Icon as typeof Sparkles;
              return <article key={String(title)}><IconComponent size={20} /><h3>{String(title)}</h3><p>{String(copy)}</p></article>;
            })}
          </div>
        </section>

        <section className="migration-section section" id="migration">
          <div className="migration-copy">
            <div className="section-kicker">MIGRATION, WITHOUT THE REBUILD</div>
            <h2>Bring your n8n<br />workflows with you.</h2>
            <p>Upload your export. OutcomeOS maps supported nodes, identifies gaps, and creates a testable outcome while preserving the original workflow for reference.</p>
            <ul>
              {["Upload an n8n JSON export", "Map existing credentials securely", "Identify unsupported or partial nodes", "Convert and test before activation"].map((item) => <li key={item}><Check size={15} />{item}</li>)}
            </ul>
            <Link className="button button-dark button-large" href="/app/import/n8n">Analyze my n8n workflow <ArrowRight size={16} /></Link>
          </div>
          <div className="compat-card">
            <div className="compat-heading"><div><Import size={18} /><span>Lead routing.json</span></div><span>ANALYZED</span></div>
            <div className="compat-score"><strong>92%</strong><div><b>Ready to convert</b><span>12 of 13 nodes supported</span></div></div>
            <div className="compat-bar"><span /></div>
            <div className="compat-rows">
              <div><span className="compat-icon success"><Check size={13} /></span><p><b>10 supported nodes</b><small>Webhook, IF, Slack, HubSpot, Set…</small></p><BadgeCheck size={17} /></div>
              <div><span className="compat-icon warning">!</span><p><b>2 partially supported</b><small>Expressions require review</small></p><ArrowRight size={17} /></div>
              <div><span className="compat-icon neutral">?</span><p><b>1 manual review</b><small>Custom Code node is isolated</small></p><ArrowRight size={17} /></div>
            </div>
            <div className="compat-note"><LockKeyhole size={15} /><span>Your original JSON is preserved. Nothing runs until you approve and activate it.</span></div>
          </div>
        </section>

        <section className="template-section section" id="templates">
          <div className="section-kicker">OUTCOME TEMPLATES</div>
          <h2>Start with work worth automating.</h2>
          <p>Real operating patterns, ready to adapt to your team and stack.</p>
          <div className="template-grid">
            {templates.map(([department, title, tools, saved]) => (
              <Link href="/app/templates" key={title}><span>{department}</span><h3>{title}</h3><p>{tools}</p><footer><small><Clock3 size={13} /> Saves {saved}</small><ArrowRight size={16} /></footer></Link>
            ))}
          </div>
          <Link className="text-link" href="/app/templates">Explore all templates <ArrowRight size={15} /></Link>
        </section>

        <section className="compare-section section">
          <div className="section-kicker">COMPARE APPROACHES</div>
          <h2>Same power. A better starting point.</h2>
          <div className="comparison-table" role="table" aria-label="Traditional workflow builders compared with OutcomeOS">
            <div className="comparison-head" role="row"><span /><b>Traditional builders</b><strong><span className="mini-mark">O</span> OutcomeOS</strong></div>
            {[
              ["Setup", "Configure nodes and fields", "Describe the outcome"],
              ["Maintenance", "Manual workflow upkeep", "AI-monitored improvements"],
              ["Debugging", "Inspect technical logs", "Plain-language diagnosis"],
              ["Technical knowledge", "Workflow concepts required", "Business context is enough"],
              ["Optimization", "Manual analysis and edits", "Suggested fixes with impact"],
              ["Migration", "Often rebuilt by hand", "n8n compatibility analysis"],
              ["Business access", "Best for specialists", "Designed for operators"]
            ].map(([label, old, outcome]) => <div role="row" key={label}><b>{label}</b><span><X size={14} />{old}</span><strong><Check size={14} />{outcome}</strong></div>)}
          </div>
        </section>

        <section className="pricing-section section" id="pricing">
          <div className="section-kicker">SIMPLE PRICING</div>
          <h2>Start free. Scale by outcomes.</h2>
          <div className="billing-toggle"><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button><button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual <span>Save 20%</span></button></div>
          <div className="pricing-grid">
            {[
              ["Free", 0, "For trying your first outcomes", ["3 active outcomes", "500 monthly executions", "Basic integrations", "Community support"], false],
              ["Pro", 39, "For operators automating real work", ["20 active outcomes", "10,000 monthly executions", "AI workflow builder", "Advanced execution history", "n8n import", "Email support"], true],
              ["Team", 149, "For teams running shared operations", ["100 active outcomes", "50,000 monthly executions", "Team workspaces", "Approval steps", "Shared connections", "Priority support"], false],
              ["Business", null, "For scale, control, and deployment choice", ["Higher execution limits", "Private cloud options", "SSO and audit logs", "Custom integrations", "SLA"], false]
            ].map(([name, price, copy, items, popular]) => (
              <article className={popular ? "popular" : ""} key={String(name)}>
                {popular && <div className="popular-label">MOST POPULAR</div>}
                <h3>{String(name)}</h3><p>{String(copy)}</p>
                <div className="price">{price === null ? <><strong>Custom</strong></> : <><sup>$</sup><strong>{annual ? Math.round(Number(price) * 0.8) : Number(price)}</strong><span>/ month</span></>}</div>
                <Link className={`button ${popular ? "button-primary" : "button-secondary"}`} href="/register">{name === "Business" ? "Contact sales" : name === "Free" ? "Start free" : `Choose ${name}`}</Link>
                <ul>{(items as string[]).map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section section">
          <div><div className="section-kicker">FAQ</div><h2>Questions, answered.</h2><p>Need something more specific? <a href="mailto:hello@outcomeos.dev">Talk to us.</a></p></div>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <button key={question} aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{question}<ChevronDown size={18} /></span>
                <AnimatePresence>{openFaq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>}</AnimatePresence>
              </button>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div className="final-pattern" aria-hidden="true" />
          <div className="section-kicker">YOUR NEXT AUTOMATION STARTS WITH A SENTENCE</div>
          <h2>Stop building workflows.<br />Start defining outcomes.</h2>
          <p>Describe what your business needs. OutcomeOS handles everything between the idea and the result.</p>
          <Link className="button button-light button-large" href="/register">Create your first outcome <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div><Logo /><p>Automation without workflows.</p></div>
        <div>{["Product", "Templates", "Documentation", "Security", "Status"].map((item) => <a key={item} href={item === "Templates" ? "#templates" : "#product"}>{item}</a>)}</div>
        <div>{["Pricing", "Privacy", "Terms", "Contact", "GitHub"].map((item) => <a key={item} href={item === "Pricing" ? "#pricing" : item === "Contact" ? "mailto:hello@outcomeos.dev" : "#"}>{item}</a>)}</div>
        <p>© {new Date().getFullYear()} OutcomeOS. Built for better operations.</p>
      </footer>
    </div>
  );
}
