"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Clock3,
  GitBranch, LifeBuoy, LockKeyhole, MessageSquare,
  Play, RefreshCw, ShieldCheck, Sparkles, Users2, X
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/reveal";
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
  [Sparkles, "It builds itself", "Write what you want in a sentence. The automation is ready in minutes, not weeks."],
  [RefreshCw, "It fixes itself", "When something breaks, Rezaru finds the cause and offers a fix. You just approve it."],
  [LifeBuoy, "Answers in plain words", "No logs, no error codes. You read what happened the way you'd hear it from a colleague."],
  [BadgeCheck, "You stay in control", "Payments, letters, anything sensitive waits for your yes before it runs."],
  [Users2, "Your whole team", "Give each person exactly the access they need — no more, no less."],
  [LockKeyhole, "Your data stays yours", "Passwords and keys are encrypted and never shown in the browser."]
];

const templates = [
  ["Sales", "Never lose an inbound lead", "Every request lands in your CRM and the right person hears about it", "4 hrs / week"],
  ["Finance", "Catch problem invoices early", "Large or unusual invoices come to you for a decision before they're paid", "6 hrs / week"],
  ["Support", "Answer customers faster", "Requests are sorted, routed, and the urgent ones surface first", "8 hrs / week"],
  ["Revenue", "Recover failed payments", "A declined card triggers a polite reminder instead of a silent lost sale", "5 hrs / week"]
];

const faqs = [
  ["Do I need to be technical?", "No. If you can describe the task to a new employee, you can set it up. Everything technical happens out of sight."],
  ["How long until it works?", "The first automation usually takes a few minutes. You describe the result, check the plan, and switch it on."],
  ["What if it does something wrong?", "It can't act on its own where it matters. You approve the plan before launch, and anything sensitive waits for your confirmation each time."],
  ["Will it work with my tools?", "Yes, if you use the usual ones — mail, chat, spreadsheets, CRM, payments. If something is missing, tell us and we'll connect it."],
  ["How much does it cost to try?", "Nothing. The free plan needs no card and includes enough runs to see whether it fits."]
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
      {/* Grain filters. Two strengths: one bites into the headline, one only
          veils the watermark. */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <filter id="rz-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
        <filter id="rz-noise-soft">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feComponentTransfer><feFuncA type="linear" slope="0.075" /></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="cinema-bg" aria-hidden="true" />
      <div className="guide-line guide-line--left" aria-hidden="true" />
      <div className="guide-line guide-line--right" aria-hidden="true" />

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo />
          <nav aria-label="Primary navigation">
            <a href="#how">How it works</a>
            <a href="#templates">Examples</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="nav-actions">
            <ThemeToggle />
            <Link className="nav-signin" href="/login">Sign in</Link>
            <Link className="button button-primary button-small" href="/register">Start free <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="product">
          <div className="eyebrow"><span className="eyebrow-dot" /> Automation without workflows</div>
          <h1>Say what you need.<br /><em className="shiny-text">It gets done by itself.</em></h1>
          <p className="hero-copy">Rezaru takes over the routine your team repeats every day — orders, invoices, replies, reminders. You describe the task once in plain words.</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">Try it free <ArrowRight size={17} /></Link>
            <Link className="button button-secondary button-large" href="#how">See how it works</Link>
          </div>
          <p className="hero-note"><Check size={14} /> Free to start · No card required</p>

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
          <span>Set up in minutes</span><i />
          <span>No developer needed</span><i />
          <span>Works with the tools you already use</span>
        </section>

        <section className="problem-section section">
          <div className="section-kicker">A BETTER ABSTRACTION</div>
          <h2>You should not need to become<br />an automation engineer.</h2>
          <p>Traditional builders expose the machinery. Rezaru gives your team a reliable operator that handles it.</p>
          <div className="process-compare">
            <div className="old-process">
              <span>THE OLD PROCESS</span>
              <div>{["Triggers", "Nodes", "Conditions", "JSON", "Debugging", "Maintenance"].map((label, index) => <div key={label}><i>{index + 1}</i>{label}{index < 5 && <ArrowRight size={15} />}</div>)}</div>
              <p><X size={15} /> More time maintaining tools than improving operations</p>
            </div>
            <div className="new-process">
              <span>THE REZARU PROCESS</span>
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
              [MessageSquare, "01", "Describe the result.", "Say what should happen in business language. Rezaru asks only what it truly needs."],
              [GitBranch, "02", "Connect your tools.", "Review the generated plan and securely connect the applications it needs."],
              [Play, "03", "Let Rezaru run it.", "Test, activate, and follow every execution while AI watches for improvements."]
            ].map(([Icon, number, title, copy], index) => {
              const IconComponent = Icon as typeof MessageSquare;
              return <Reveal className="how-card" key={String(number)} delay={index * 70}><span>{String(number)}</span><IconComponent size={24} /><h3>{String(title)}</h3><p>{String(copy)}</p></Reveal>;
            })}
          </div>
        </section>

        <section className="feature-section section">
          <div className="section-heading-row"><div><div className="section-kicker">WHAT YOU GET</div><h2>Six things that save your week.</h2></div><p>No settings to learn, no diagrams to draw. You describe the task — the rest is our job.</p></div>
          <div className="feature-grid">
            {features.map(([Icon, title, copy], index) => {
              const IconComponent = Icon as typeof Sparkles;
              return <Reveal as="article" key={String(title)} delay={(index % 4) * 70}><IconComponent size={20} /><h3>{String(title)}</h3><p>{String(copy)}</p></Reveal>;
            })}
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

        <section className="pricing-section section" id="pricing">
          <div className="watermark" aria-hidden="true">
            <span className="watermark-1">Say what you need.</span>
            <span className="watermark-2">It gets done.</span>
          </div>
          <div className="section-kicker">SIMPLE PRICING</div>
          <h2>Start free. Pay when it saves you time.</h2>
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
          <div><div className="section-kicker">FAQ</div><h2>Questions, answered.</h2><p>Need something more specific? <a href="mailto:hello@rezaru.dev">Talk to us.</a></p></div>
          <div className="faq-list">
            {faqs.map(([question, answer], index) => (
              <button key={question} aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{question}<ChevronDown size={18} /></span>
                <AnimatePresence>{openFaq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>}</AnimatePresence>
              </button>
            ))}
          </div>
        </section>

        <section className="final-cta liquid-glass">
          <div className="final-pattern" aria-hidden="true" />
          <div className="section-kicker">YOUR NEXT AUTOMATION STARTS WITH A SENTENCE</div>
          <h2>Stop building workflows.<br />Start defining outcomes.</h2>
          <p>Describe what your business needs. Rezaru handles everything between the idea and the result.</p>
          <Link className="button button-light button-large" href="/register">Create your first outcome <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div><Logo /><p>Automation without workflows.</p></div>
        <div>{["Product", "Templates", "Documentation", "Security", "Status"].map((item) => <a key={item} href={item === "Templates" ? "#templates" : "#product"}>{item}</a>)}</div>
        <div>{["Pricing", "Privacy", "Terms", "Contact", "GitHub"].map((item) => <a key={item} href={item === "Pricing" ? "#pricing" : item === "Contact" ? "mailto:hello@rezaru.dev" : "#"}>{item}</a>)}</div>
        <p>© {new Date().getFullYear()} Rezaru. Built for better operations.</p>
      </footer>
    </div>
  );
}
