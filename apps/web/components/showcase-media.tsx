"use client";

import Image from "next/image";
import { ChatPreview, type ChatMessage } from "@/components/chat-preview";
import type { ScenarioMedia } from "@/components/landing-media";

/**
 * Shows a real screenshot or screencast when one is configured, and the
 * conversation mock when it is not. Either way the caption beside it stays —
 * the media illustrates the explanation, it does not replace it.
 */
export function ShowcaseMedia({
  media,
  messages,
  scenarioKey
}: {
  media: ScenarioMedia;
  messages: readonly ChatMessage[];
  scenarioKey: number;
}) {
  if (media?.kind === "video") {
    return (
      <figure className="showcase-media">
        <video
          key={media.src}
          className="showcase-video"
          src={media.src}
          poster={media.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={media.alt}
        />
      </figure>
    );
  }

  if (media?.kind === "image") {
    return (
      <figure className="showcase-media">
        <Image
          src={media.src}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading="lazy"
          sizes="(max-width: 760px) 100vw, 620px"
          className="showcase-image"
        />
      </figure>
    );
  }

  return <ChatPreview key={scenarioKey} messages={messages} />;
}
