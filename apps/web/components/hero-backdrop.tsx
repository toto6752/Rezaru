"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Scroll-reactive hero backdrop: an arch that opens as you scroll.
 *
 * Built on Framer Motion rather than WebGL on purpose — three.js is not a
 * dependency here and cannot be added without regenerating the lockfile the
 * Docker build installs from.
 *
 * Only transform and opacity animate, both of which the compositor handles off
 * the main thread. The blur is set once in CSS and never animated; animating a
 * filter forces a repaint every frame and is what usually costs the 60fps.
 */
export function HeroBackdrop({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduced = useReducedMotion();
  const pointer = useRef({ x: 0, y: 0 });

  // 0 at the top of the hero, 1 when the hero has scrolled away.
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });

  // The door: shut on load, open through the first third, then step back so it
  // never competes with the cards further down.
  const spread = useTransform(scrollYProgress, [0, 0.3, 1], [0.82, 1.25, 1.5]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const glow = useTransform(scrollYProgress, [0, 0.3, 1], [0.55, 0.9, 0.2]);
  const archOpen = useTransform(scrollYProgress, [0, 0.35], [0, 1]);
  const archFade = useTransform(scrollYProgress, [0, 0.35, 1], [0, 0.5, 0.08]);

  // Cursor parallax, softened so it drifts rather than snaps.
  const px = useSpring(0, { stiffness: 40, damping: 18, mass: 0.6 });
  const py = useSpring(0, { stiffness: 40, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    function onMove(event: PointerEvent) {
      pointer.current = {
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2
      };
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        px.set(pointer.current.x * 26);
        py.set(pointer.current.y * 18);
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reduced, px, py]);

  // Reduced motion: a still, soft gradient. No drift, no scroll coupling.
  if (reduced) {
    return <div className="hero-backdrop hero-backdrop--still" aria-hidden="true" />;
  }

  return (
    <div className="hero-backdrop" aria-hidden="true">
      <motion.div className="hero-blobs" style={{ scale: spread, y: lift, opacity: glow, x: px }}>
        <span className="hero-blob hero-blob--cherry" />
        <span className="hero-blob hero-blob--maroon" />
        <span className="hero-blob hero-blob--cream" />
      </motion.div>

      <motion.svg
        className="hero-arch"
        viewBox="0 0 400 320"
        fill="none"
        preserveAspectRatio="xMidYMax meet"
        style={{ scale: spread, y: lift, x: py, opacity: archFade }}
      >
        {/* The doorway from the logo, drawn as the page opens. */}
        <motion.path
          d="M60 320V150a140 140 0 0 1 280 0v170"
          stroke="var(--accent-lite)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: archOpen }}
        />
        <motion.path
          d="M120 320V162a80 80 0 0 1 160 0v158"
          stroke="var(--ink)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity={0.35}
          style={{ pathLength: archOpen }}
        />
      </motion.svg>
    </div>
  );
}
