/**
 * Real media for the "live example" section.
 *
 * Drop files into `apps/web/public/screenshots/` and fill an entry in below.
 * Each entry lines up with the scenario at the same index in
 * `copy.<lang>.showcase.scenarios`. Leave an entry as `null` and that scenario
 * falls back to the built-in conversation mock, so the page never shows a
 * broken image while you are still collecting screenshots.
 *
 * The text beside the media is never replaced — plenty of visitors will not
 * play a video, and the explanation has to stand on its own.
 */

export type ScenarioMedia =
  | {
      kind: "video";
      /** Public path, e.g. "/screenshots/agent-reply.mp4" */
      src: string;
      /** First frame, shown before the video decodes and if it never plays. */
      poster: string;
      /** Described for screen readers — a video with no audio needs this. */
      alt: string;
    }
  | {
      kind: "image";
      src: string;
      /** Intrinsic size, so the layout does not jump while it loads. */
      width: number;
      height: number;
      alt: string;
    }
  | null;

export const showcaseMedia: readonly ScenarioMedia[] = [
  // Scenario 1 — shop / Instagram.
  // { kind: "image", src: "/screenshots/shop-instagram.png", width: 1200, height: 900,
  //   alt: "Переписка агента с клиентом о наличии и доставке" },
  null,

  // Scenario 2 — barbershop / Telegram.
  // { kind: "video", src: "/screenshots/booking.mp4", poster: "/screenshots/booking.jpg",
  //   alt: "Агент согласовывает время записи и передаёт вопрос о скидке владельцу" },
  null
];
