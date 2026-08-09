/**
 * Real media for the landing.
 *
 * Drop files into `apps/web/public/screenshots/` and fill an entry in below.
 * Leave an entry `null` and that slot shows an honest interface mock instead,
 * so the page never carries a broken file — and never a fabricated screenshot
 * of a conversation that did not happen.
 */

export type ScenarioMedia =
  | {
      kind: "video";
      /** Public path, e.g. "/screenshots/cafe-chat.mp4" */
      src: string;
      /** First frame — shown before it decodes and if it never plays. */
      poster: string;
      /** The video is silent, so this carries the meaning for screen readers. */
      alt: string;
    }
  | {
      kind: "image";
      src: string;
      /** Intrinsic size, so nothing jumps while it loads. */
      width: number;
      height: number;
      alt: string;
    }
  | null;

/** Section 2 — the looping recording of a real conversation. */
export const demoMedia: ScenarioMedia =
  // { kind: "video", src: "/screenshots/cafe-chat.mp4", poster: "/screenshots/cafe-chat.jpg",
  //   alt: "Клиент спрашивает про время работы и бронь, агент отвечает и записывает столик" }
  null;

/** Section 4 — one screenshot per onboarding step, in order. */
export const howMedia: readonly ScenarioMedia[] = [
  // { kind: "image", src: "/screenshots/step-1-describe.png", width: 1400, height: 900,
  //   alt: "Поле, в котором владелец описывает агента обычными словами" },
  null,
  // { kind: "image", src: "/screenshots/step-2-template.png", width: 1400, height: 900,
  //   alt: "Готовый шаблон агента с шагами, которые можно править" },
  null,
  // { kind: "image", src: "/screenshots/step-3-connect.png", width: 1400, height: 900,
  //   alt: "Экран подключения Telegram, Instagram и WhatsApp" },
  null
];
