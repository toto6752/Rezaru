"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Clock3, Play, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { Reveal } from "@/components/reveal";
import { copy, demoExamples, LANG_KEY, type Lang } from "@/components/landing-copy";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "./logo";

export function LandingPage() {
  // Russian is the default; a saved choice wins on later visits. Reading
  // localStorage in an effect keeps the server and first client render equal.
  const [lang, setLang] = useState<Lang>("ru");
  const [demoIndex, setDemoIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [generated, setGenerated] = useState(true);
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "ru" || saved === "en") setLang(saved);
    } catch {
      // private mode — the default stands
    }
  }, []);

  function changeLang(next: Lang) {
    setLang(next);
    setCustomPrompt(null);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // private mode — the choice just will not survive a reload
    }
  }

  const t = copy[lang];
  const examples = demoExamples[lang];
  const demoPrompt = customPrompt ?? examples[demoIndex]!.prompt;

  const currentDemo = useMemo(
    () => examples.find((example) => example.prompt === demoPrompt) ?? {
      label: lang === "ru" ? "Своя задача" : "Custom task",
      prompt: demoPrompt,
      steps: lang === "ru"
        ? ["Понять, какой нужен результат", "Проверить исходные данные", "Подключить нужные сервисы", "Надёжно выполнить работу", "Записать и отследить результат"]
        : ["Understand the requested result", "Validate the inputs", "Connect the required tools", "Run the work reliably", "Record and monitor the result"]
    },
    [demoPrompt, examples, lang]
  );

  const generate = () => {
    setGenerated(false);
    window.setTimeout(() => setGenerated(true), 450);
  };

  const chooseExample = (index: number) => {
    setDemoIndex(index);
    setCustomPrompt(null);
    setGenerated(false);
    window.setTimeout(() => setGenerated(true), 260);
  };

  return (
    <div className="landing" lang={lang}>
      {/* Grain filters. One bites into the headline, one only veils the watermark. */}
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

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo />
          <nav aria-label="Primary navigation">
            <a href="#how">{t.nav.how}</a>
            <a href="#templates">{t.nav.examples}</a>
            <a href="#pricing">{t.nav.pricing}</a>
          </nav>
          <div className="nav-actions">
            <LangToggle lang={lang} onChange={changeLang} />
            <ThemeToggle />
            <Link className="nav-signin" href="/login">{t.nav.signin}</Link>
            <Link className="button button-primary button-small" href="/register">{t.nav.start} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="product">
          <div className="eyebrow"><span className="eyebrow-dot" /> {t.hero.eyebrow}</div>
          <h1>{t.hero.title1}<br /><em className="shiny-text">{t.hero.title2}</em></h1>
          <p className="hero-copy">{t.hero.copy}</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">{t.hero.cta} <ArrowRight size={17} /></Link>
            <Link className="button button-secondary button-large" href="#how">{t.hero.secondary}</Link>
          </div>
          <p className="hero-note"><Check size={14} /> {t.hero.note}</p>

          <div className="demo-shell">
            <div className="demo-window-bar">
              <div className="window-dots"><span /><span /><span /></div>
              <span>{t.demo.title}</span>
              <div className="demo-live"><span /> {t.demo.live}</div>
            </div>
            <div className="demo-layout">
              <div className="demo-compose">
                <div className="demo-compose-label"><Sparkles size={15} /> {t.demo.label}</div>
                <textarea aria-label={t.demo.label} value={demoPrompt} onChange={(event) => setCustomPrompt(event.target.value)} />
                <div className="demo-examples">
                  {examples.map((example, index) => (
                    <button key={example.label} className={demoIndex === index && customPrompt === null ? "active" : ""} onClick={() => chooseExample(index)}>{example.label}</button>
                  ))}
                </div>
                <button className="button button-primary demo-generate" onClick={generate}><Sparkles size={16} /> {t.demo.generate}</button>
              </div>
              <div className="demo-plan">
                <div className="demo-plan-heading">
                  <div><span>{t.demo.planKicker}</span><h3>{currentDemo.label}</h3></div>
                  <span className="risk-badge"><ShieldCheck size={13} /> {t.demo.validated}</span>
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
                  ) : <div className="plan-loading"><Sparkles size={20} /><p>{lang === "ru" ? "Подбираем самый безопасный путь…" : "Designing the safest route…"}</p></div>}
                </AnimatePresence>
              </div>
            </div>
            <div className="demo-footer">
              <span><Clock3 size={14} /> {lang === "ru" ? "Настройка: около 3 минут" : "Estimated setup: 3 minutes"}</span>
              <span><Play size={14} /> {lang === "ru" ? "Проверка на тестовых данных" : "Test with sample data"}</span>
            </div>
          </div>
        </section>

        <section className="proof-strip">
          {t.proof.map((item, index) => (
            <span key={item}>{item}{index < t.proof.length - 1 && <i />}</span>
          ))}
        </section>

        <section className="problem-section section">
          <div className="section-kicker">{t.problem.kicker}</div>
          <h2>{t.problem.title1}<br />{t.problem.title2}</h2>
          <p>{t.problem.copy}</p>
          <div className="process-compare">
            <div className="old-process">
              <span>{t.problem.oldLabel}</span>
              <div>{t.problem.oldSteps.map((label, index) => <div key={label}><i>{index + 1}</i>{label}{index < t.problem.oldSteps.length - 1 && <ArrowRight size={15} />}</div>)}</div>
              <p><X size={15} /> {t.problem.oldNote}</p>
            </div>
            <div className="new-process">
              <span>{t.problem.newLabel}</span>
              <div>{t.problem.newSteps.map((label, index) => <div key={label}><i>{index + 1}</i>{label}{index < t.problem.newSteps.length - 1 && <ArrowRight size={18} />}</div>)}</div>
              <p><Check size={15} /> {t.problem.newNote}</p>
            </div>
          </div>
        </section>

        <section className="how-section section" id="how">
          <div className="section-kicker">{t.how.kicker}</div>
          <h2>{t.how.title}</h2>
          <p>{t.how.copy}</p>
          <div className="how-grid">
            {t.how.steps.map(([Icon, number, title, text], index) => {
              const IconComponent = Icon as typeof Play;
              return <Reveal className="how-card" key={String(number)} delay={index * 70}><span>{String(number)}</span><IconComponent size={24} /><h3>{String(title)}</h3><p>{String(text)}</p></Reveal>;
            })}
          </div>
        </section>

        <section className="feature-section section">
          <div className="section-heading-row"><div><div className="section-kicker">{t.features.kicker}</div><h2>{t.features.title}</h2></div><p>{t.features.copy}</p></div>
          <div className="feature-grid">
            {t.features.items.map(([Icon, title, text], index) => {
              const IconComponent = Icon as typeof Sparkles;
              return <Reveal as="article" key={String(title)} delay={(index % 3) * 70}><IconComponent size={20} /><h3>{String(title)}</h3><p>{String(text)}</p></Reveal>;
            })}
          </div>
        </section>

        <section className="template-section section" id="templates">
          <div className="section-kicker">{t.templates.kicker}</div>
          <h2>{t.templates.title}</h2>
          <p>{t.templates.copy}</p>
          <div className="template-grid">
            {t.templates.items.map(([department, title, text, saved]) => (
              <Link href="/app/templates" key={title}><span>{department}</span><h3>{title}</h3><p>{text}</p><footer><small><Clock3 size={13} /> {t.templates.saves} {saved}</small><ArrowRight size={16} /></footer></Link>
            ))}
          </div>
          <Link className="text-link" href="/app/templates">{t.templates.explore} <ArrowRight size={15} /></Link>
        </section>

        <section className="pricing-section section" id="pricing">
          <div className="watermark" aria-hidden="true">
            <span className="watermark-1">{t.pricing.watermark1}</span>
            <span className="watermark-2">{t.pricing.watermark2}</span>
          </div>
          <div className="section-kicker">{t.pricing.kicker}</div>
          <h2>{t.pricing.title}</h2>
          <div className="billing-toggle">
            <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>{t.pricing.monthly}</button>
            <button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>{t.pricing.annual} <span>{t.pricing.save}</span></button>
          </div>
          <div className="pricing-grid">
            {t.pricing.plans.map(([name, price, text, items, popular]) => (
              <article className={popular ? "popular" : ""} key={String(name)}>
                {popular ? <div className="popular-label">{lang === "ru" ? "ВЫБИРАЮТ ЧАЩЕ" : "MOST POPULAR"}</div> : null}
                <h3>{String(name)}</h3><p>{String(text)}</p>
                <div className="price">{price === null ? <strong>{t.pricing.custom}</strong> : <><sup>$</sup><strong>{annual ? Math.round(Number(price) * 0.8) : Number(price)}</strong><span>{t.pricing.month}</span></>}</div>
                <Link className={`button ${popular ? "button-primary" : "button-secondary"}`} href="/register">
                  {price === null ? t.pricing.contact : Number(price) === 0 ? t.pricing.startFree : `${t.pricing.choose} ${name}`}
                </Link>
                <ul>{(items as readonly string[]).map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-section section">
          <div><div className="section-kicker">{t.faq.kicker}</div><h2>{t.faq.title}</h2></div>
          <div className="faq-list">
            {t.faq.items.map(([question, answer], index) => (
              <button key={question} aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{question}<ChevronDown size={18} /></span>
                <AnimatePresence>{openFaq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>}</AnimatePresence>
              </button>
            ))}
          </div>
        </section>

        <section className="final-cta liquid-glass">
          <div className="final-pattern" aria-hidden="true" />
          <div className="section-kicker">{t.finalCta.kicker}</div>
          <h2>{t.finalCta.title1}<br />{t.finalCta.title2}</h2>
          <p>{t.finalCta.copy}</p>
          <Link className="button button-light button-large" href="/register">{t.finalCta.cta} <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div><Logo /><p>{lang === "ru" ? "Автоматизация без схем и настроек." : "Automation without workflows."}</p></div>
        <div>
          <a href="#product">{lang === "ru" ? "Продукт" : "Product"}</a>
          <a href="#how">{t.nav.how}</a>
          <a href="#templates">{t.nav.examples}</a>
        </div>
        <div>
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="mailto:hello@rezaru.dev">{lang === "ru" ? "Связаться" : "Contact"}</a>
        </div>
        <p>© {new Date().getFullYear()} Rezaru</p>
      </footer>
    </div>
  );
}
