"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { Reveal } from "@/components/reveal";
import { ChatPreview } from "@/components/chat-preview";
import { copy, focusKeys, teamSizes, LANG_KEY, type FocusKey, type Lang } from "@/components/landing-copy";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

export function LandingPage() {
  // Russian is the default; a saved choice wins on later visits. Reading
  // localStorage in an effect keeps the server and first client render equal.
  const [lang, setLang] = useState<Lang>("ru");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scenario, setScenario] = useState(0);

  // The builder is the real onboarding: three answers, then a template.
  const [task, setTask] = useState("");
  const [team, setTeam] = useState<string>(teamSizes[0]);
  const [focus, setFocus] = useState<FocusKey>("replies");
  const [built, setBuilt] = useState(true);

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
    setTask("");
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // private mode — the choice just will not survive a reload
    }
  }

  const t = copy[lang];
  const steps = t.builder.plans[focus];

  function rebuild(next?: () => void) {
    next?.();
    setBuilt(false);
    window.setTimeout(() => setBuilt(true), 340);
  }

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
            <a href="#examples">{t.nav.examples}</a>
            <a href="#how">{t.nav.how}</a>
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
        {/* ── 1. Hero: the result, shown as it happens at 02:47 ── */}
        <section className="hero hero--split" id="product">
          <div className="hero-copy-col">
            <div className="eyebrow"><span className="eyebrow-dot" /> {t.hero.eyebrow}</div>
            <h1>{t.hero.title1}<br /><em className="shiny-text">{t.hero.title2}</em></h1>
            <p className="hero-copy">{t.hero.copy}</p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href="/register">{t.hero.cta} <ArrowRight size={17} /></Link>
              <Link className="button button-secondary button-large" href="#examples">{t.hero.secondary}</Link>
            </div>
            <p className="hero-note"><Check size={14} /> {t.hero.note}</p>
          </div>

          <div className="hero-phone liquid-glass">
            <div className="hero-phone-bar">
              <span className="hero-phone-dot" />
              <b>Instagram Direct</b>
              <span className="hero-phone-time">{t.hero.chatTime}</span>
            </div>
            <ChatPreview messages={t.hero.chat} animate={false} />
          </div>
        </section>

        <section className="proof-strip">
          {t.proof.map((item, index) => (
            <span key={item}>{item}{index < t.proof.length - 1 && <i />}</span>
          ))}
        </section>

        {/* ── 2. Live example: two real conversations ── */}
        <section className="showcase-section section" id="examples">
          <div className="section-kicker">{t.showcase.kicker}</div>
          <h2>{t.showcase.title}</h2>
          <p>{t.showcase.copy}</p>

          <div className="showcase-tabs" role="tablist">
            {t.showcase.scenarios.map((item, index) => (
              <button
                key={item.tab}
                role="tab"
                aria-selected={scenario === index}
                className={scenario === index ? "active" : ""}
                onClick={() => setScenario(index)}
              >
                {item.tab}
              </button>
            ))}
          </div>

          <div className="showcase-stage liquid-glass">
            <p className="showcase-note">{t.showcase.scenarios[scenario]!.note}</p>
            <ChatPreview key={scenario} messages={t.showcase.scenarios[scenario]!.messages} />
          </div>
        </section>

        {/* ── 3. How it works: the actual onboarding, live ── */}
        <section className="how-section section" id="how">
          <div className="section-kicker">{t.how.kicker}</div>
          <h2>{t.how.title}</h2>
          <p>{t.how.copy}</p>

          <div className="how-grid">
            {t.how.steps.map(([number, title, text], index) => (
              <Reveal className="how-card" key={String(number)} delay={index * 70}>
                <span>{String(number)}</span>
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </Reveal>
            ))}
          </div>

          <div className="demo-shell">
            <div className="demo-window-bar">
              <div className="window-dots"><span /><span /><span /></div>
              <span>{t.builder.title}</span>
              <div className="demo-live"><span /> {t.builder.live}</div>
            </div>

            <div className="demo-layout">
              <div className="demo-compose">
                <div className="builder-step">
                  <label className="builder-label" htmlFor="builder-task"><b>1</b> {t.builder.step1}</label>
                  <textarea id="builder-task" placeholder={t.builder.step1Hint} value={task} onChange={(event) => setTask(event.target.value)} />
                  <div className="demo-examples">
                    {t.builder.examples.map((example) => (
                      <button key={example} className={task === example ? "active" : ""} onClick={() => rebuild(() => setTask(example))}>{example}</button>
                    ))}
                  </div>
                </div>

                <div className="builder-step">
                  <span className="builder-label"><b>2</b> {t.builder.step2}</span>
                  <div className="builder-choice">
                    {teamSizes.map((size) => (
                      <button key={size} className={team === size ? "active" : ""} onClick={() => setTeam(size)}>{size}</button>
                    ))}
                  </div>
                </div>

                <div className="builder-step">
                  <span className="builder-label"><b>3</b> {t.builder.step3}</span>
                  <div className="builder-choice builder-choice--wrap">
                    {focusKeys.map((key) => (
                      <button key={key} className={focus === key ? "active" : ""} onClick={() => rebuild(() => setFocus(key))}>{t.builder.focus[key]}</button>
                    ))}
                  </div>
                </div>

                <button className="button button-primary demo-generate" onClick={() => rebuild()}><Sparkles size={16} /> {t.builder.generate}</button>
              </div>

              <div className="demo-plan">
                <div className="demo-plan-heading">
                  <div><span>{t.builder.resultKicker}</span><h3>{task.trim() || t.builder.focus[focus]}</h3></div>
                  <span className="risk-badge">{team}</span>
                </div>

                <AnimatePresence mode="wait">
                  {built ? (
                    <motion.ol key={focus + task} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {steps.map((step, index) => (
                        <motion.li key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07 }}>
                          <span>{index + 1}</span><p>{step}</p>{index < steps.length - 1 && <i />}
                        </motion.li>
                      ))}
                    </motion.ol>
                  ) : (
                    <div className="plan-loading"><Sparkles size={20} /><p>{t.builder.generate}…</p></div>
                  )}
                </AnimatePresence>

                <p className="builder-note">{t.builder.resultNote}</p>
              </div>
            </div>

            <div className="demo-footer">
              <span>{t.builder.connectors}</span>
              <div className="builder-channels">
                {t.channels.items.map((name) => <i key={name}>{name}</i>)}
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Skills: one concrete ability per card ── */}
        <section className="feature-section section">
          <div className="section-heading-row">
            <div><div className="section-kicker">{t.skills.kicker}</div><h2>{t.skills.title}</h2></div>
            <p>{t.skills.copy}</p>
          </div>
          <div className="feature-grid">
            {t.skills.items.map(([Icon, title, text], index) => {
              const IconComponent = Icon as typeof Clock3;
              return (
                <Reveal as="article" key={String(title)} delay={(index % 3) * 70}>
                  <IconComponent size={20} />
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 5. Channels: a strip, not a section ── */}
        <section className="channel-strip">
          <span>{t.channels.title}</span>
          <div>{t.channels.items.map((name) => <i key={name}>{name}</i>)}</div>
        </section>

        {/* ── 6. Pricing ── */}
        <section className="pricing-section section" id="pricing">
          <div className="watermark" aria-hidden="true">
            <span className="watermark-1">{t.pricing.watermark1}</span>
            <span className="watermark-2">{t.pricing.watermark2}</span>
          </div>
          <div className="section-kicker">{t.pricing.kicker}</div>
          <h2>{t.pricing.title}</h2>
          <p className="pricing-note">{t.pricing.copy}</p>

          <div className="pricing-grid pricing-grid--three">
            {t.pricing.plans.map(([name, price, text, volume, items, popular]) => (
              <article className={popular ? "popular" : ""} key={String(name)}>
                {popular ? <div className="popular-label">{lang === "ru" ? "ВЫБИРАЮТ ЧАЩЕ" : "MOST POPULAR"}</div> : null}
                <h3>{String(name)}</h3><p>{String(text)}</p>
                <div className="price">
                  {price === null
                    ? <strong>{t.pricing.custom}</strong>
                    : <><sup>$</sup><strong>{Number(price)}</strong><span>{t.pricing.month}</span></>}
                </div>
                <div className="price-volume">
                  {volume ? `${String(volume)} ${t.pricing.unit}` : t.pricing.customNote}
                </div>
                <Link className={`button ${popular ? "button-primary" : "button-secondary"}`} href="/register">
                  {price === null ? t.pricing.contact : `${t.pricing.choose} ${name}`}
                </Link>
                <ul>{(items as readonly string[]).map((item) => <li key={item}><Check size={14} />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        {/* ── 7. Questions ── */}
        <section className="faq-section section">
          <div><div className="section-kicker">{t.faq.kicker}</div><h2>{t.faq.title}</h2></div>
          <div className="faq-list">
            {t.faq.items.map(([question, answer], index) => (
              <button key={question} aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <span>{question}<ChevronDown size={18} /></span>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </section>

        {/* ── 8. Final call: one button, no second choice ── */}
        <section className="final-cta liquid-glass">
          <div className="final-pattern" aria-hidden="true" />
          <div className="section-kicker">{t.finalCta.kicker}</div>
          <h2>{t.finalCta.title1}<br />{t.finalCta.title2}</h2>
          <p>{t.finalCta.copy}</p>
          <Link className="button button-light button-large" href="/register">{t.finalCta.cta} <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div><Logo /><p>{t.footer.tagline}</p></div>
        <div>
          <a href="#product">{t.footer.product}</a>
          <a href="#examples">{t.nav.examples}</a>
          <a href="#how">{t.nav.how}</a>
        </div>
        <div>
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="mailto:hello@rezaru.dev">{t.footer.contact}</a>
        </div>
        <p>© {new Date().getFullYear()} Rezaru</p>
      </footer>
    </div>
  );
}
