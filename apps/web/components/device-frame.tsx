"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { ScenarioMedia } from "@/components/landing-media";

/**
 * A phone or browser shell around a demo. Everything inside is framed so it
 * reads as a screenshot of the product rather than page decoration.
 *
 * When `media` is set it shows the real screenshot or screencast. Until then it
 * shows `children` — an honest interface mock, clearly a mock, never a
 * fabricated screenshot of a conversation that did not happen.
 */
export function DeviceFrame({
  kind,
  label,
  time,
  media,
  children
}: {
  kind: "phone" | "browser";
  label: string;
  time?: string;
  media?: ScenarioMedia;
  children?: ReactNode;
}) {
  return (
    <div className={`device device--${kind}`}>
      <div className="device-bar">
        {kind === "browser" ? (
          <span className="device-dots"><i /><i /><i /></span>
        ) : (
          <span className="device-signal" />
        )}
        <b>{label}</b>
        {time ? <span className="device-time">{time}</span> : null}
      </div>

      <div className="device-screen">
        {media?.kind === "video" ? (
          <video
            className="device-media"
            src={media.src}
            poster={media.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={media.alt}
          />
        ) : media?.kind === "image" ? (
          <Image
            className="device-media"
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            loading="lazy"
            sizes="(max-width: 760px) 100vw, 560px"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
