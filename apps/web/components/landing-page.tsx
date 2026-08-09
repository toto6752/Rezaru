"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangToggle } from "@/components/lang-toggle";
import { Reveal } from "@/components/reveal";
import { ChatPreview } from "@/components/chat-preview";
import { DeviceFrame } from "@/components/device-frame";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { demoMedia, howMedia } from "@/components/landing-media";
import { brandIcons, type BrandIconKey } from "@/components/brand-icons";
import { copy, plans, volumeStops, LANG_KEY, type Lang } from "@/components/landing-copy";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

export function LandingPage() {
  const [lang, setLang] = useState<Lang>("ru");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [stop, setStop] = useState(3); // 300 conversations — the Starter ceiling
  const heroRef = useRef<HTMLElement>(null);

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
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // private mode — the choice just will not survive a reload
    }
  }

  const t = copy[lang];
  const locale = lang === "ru" ? "ru-RU" : "en-US";
  const volume = volumeStops[stop]!;
  const plan = plans.find((item) => volume <= item.limit) ?? plans[plans.length - 1]!;
  const planName = t.pricing.names[plan.key];

  return (
    <div className="landing" lang={lang}>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        <filter id="rz-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="cinema-bg" aria-hidden="true" />

      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Logo />
          <nav aria-label="Primary navigation">
            <a href="#demo">{t.nav.demo}</a>
            <a href="#skills">{t.nav.skills}</a>
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
        {/* ── 1. Hero ── */}
        <section className="hero-plain" id="product" ref={heroRef}>
          <HeroBackdrop target={heroRef} />
          <h1>{t.hero.title1}<br /><em className="shiny-text">{t.hero.title2}</em></h1>
          <p className="hero-copy">{t.hero.copy}</p>
          <Link className="button button-primary button-large" href="/register">{t.hero.cta} <ArrowRight size={17} /></Link>
          <p className="hero-note"><Check size={14} /> {t.hero.note}</p>
        </section>

        {/* ── 2. Live demo, straight after the hero ── */}
        <section className="demo-section section" id="demo">
          <div className="section-kicker">{t.demo.kicker}</div>
          <h2>{t.demo.title}</h2>
          <p>{t.demo.copy}</p>

          <DeviceFrame kind="phone" label={t.demo.channel} time={t.demo.time} media={demoMedia}>
            <ChatPreview messages={t.demo.chat} />
          </DeviceFrame>

          {demoMedia ? null : <p className="device-caption">{t.demo.mockLabel}</p>}
        </section>

        {/* ── 3. What the agent does ── */}
        <section className="skills-section section" id="skills">
          <div className="section-kicker">{t.skills.kicker}</div>
          <h2>{t.skills.title}</h2>
          <div className="skills-grid">
            {t.skills.items.map(([icon, title, text], index) => {
              const IconComponent = brandIcons[icon as BrandIconKey];
              return (
                <Reveal as="article" key={String(title)} delay={(index % 3) * 70}>
                  <span className="skill-icon"><IconComponent size={26} /></span>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ── 4. Three steps, each with its own framed screen ── */}
        <section className="how-section section" id="how">
          <div className="section-kicker">{t.how.kicker}</div>
          <h2>{t.how.title}</h2>

          <div className="step-list">
            {t.how.steps.map(([number, title, text], index) => (
              <Reveal className="step-row" key={String(number)} delay={index * 60}>
                <div className="step-text">
                  <span className="step-number">{String(number)}</span>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </div>
                <DeviceFrame kind="browser" label="Rezaru" media={howMedia[index] ?? null}>
                  <div className="step-mock">
                    <span className="step-mock-line step-mock-line--wide" />
                    <span className="step-mock-line" />
                    <span className="step-mock-line step-mock-line--short" />
                  </div>
                </DeviceFrame>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 5. Pricing: the slider picks a volume, the plan follows ── */}
        <section className="pricing-section section" id="pricing">
          <div className="section-kicker">{t.pricing.kicker}</div>
          <h2>{t.pricing.title}</h2>
          <p>{t.pricing.copy}</p>

          <div className="calculator liquid-glass">
            <label className="calculator-label" htmlFor="volume">{t.pricing.sliderLabel}</label>
            <output className="calculator-volume">
              {volume >= 4000 ? "2 000+" : volume.toLocaleString(locale)}
            </output>

            <input
              id="volume"
              className="calculator-slider"
              type="range"
              min={0}
              max={volumeStops.length - 1}
              step={1}
              value={stop}
              onChange={(event) => setStop(Number(event.target.value))}
              aria-valuetext={String(volume)}
            />

            <div className="calculator-result">
              <span className="calculator-plan">{t.pricing.yourPlan}: <b>{planName}</b></span>
              {plan.price === null ? (
                <>
                  <strong className="calculator-price">{t.pricing.customPrice}</strong>
                  <p className="calculator-note">{t.pricing.customNote}</p>
                  <Link className="button button-secondary button-large" href="/register">{t.pricing.contact}</Link>
                </>
              ) : (
                <>
                  <strong className="calculator-price"><sup>$</sup>{plan.price} <span>{t.pricing.month}</span></strong>
                  <p className="calculator-note">{plan.limit.toLocaleString(locale)} {t.pricing.limitLabel}</p>
                  <Link className="button button-primary button-large" href="/register">{t.pricing.cta} <ArrowRight size={16} /></Link>
                </>
              )}
            </div>
          </div>

          <p className="pricing-note">{t.pricing.trial}</p>
        </section>

        {/* ── 6. Questions ── */}
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

        {/* ── 7. The call again ── */}
        <section className="final-cta liquid-glass">
          <div className="final-pattern" aria-hidden="true" />
          <h2>{t.finalCta.title1}<br />{t.finalCta.title2}</h2>
          <p>{t.finalCta.copy}</p>
          <Link className="button button-light button-large" href="/register">{t.finalCta.cta} <ArrowRight size={17} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div><Logo /><p>{t.footer.tagline}</p></div>
        <div>
          <a href="#demo">{t.nav.demo}</a>
          <a href="#skills">{t.nav.skills}</a>
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
