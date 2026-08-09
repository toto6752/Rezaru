/**
 * Brand icon family.
 *
 * Every icon repeats the logo mark: a rounded doorway frame with something
 * standing inside it. Stroke only, currentColor, so they take the accent from
 * whatever they sit in and work in both themes. Deliberately not a stock set —
 * the shared frame is what makes them read as one family.
 */

type IconProps = { size?: number; className?: string };

function Frame({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* The doorway: square below, arched above, open at the floor. */}
      <path d="M4 21V10a8 8 0 0 1 16 0v11" opacity=".55" />
      {children}
    </svg>
  );
}

/** Knows your price list — an open book inside the doorway. */
export function IconKnows(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M12 11.5v6" />
      <path d="M12 11.5c-1-.9-2.3-1.3-3.6-1.2v6c1.3-.1 2.6.3 3.6 1.2" />
      <path d="M12 11.5c1-.9 2.3-1.3 3.6-1.2v6c-1.3-.1-2.6.3-3.6 1.2" />
    </Frame>
  );
}

/** Calls you in — an arrow stepping out through the doorway. */
export function IconHandoff(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M9 14.5h6.5" />
      <path d="M13.2 12.2 15.5 14.5l-2.3 2.3" />
      <path d="M9 10.5v8" opacity=".55" />
    </Frame>
  );
}

/** Books your clients — a clock inside the doorway. */
export function IconBooking(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="12" cy="14.5" r="3.6" />
      <path d="M12 12.7v1.8l1.3 1" />
    </Frame>
  );
}

/** Collects enquiries — stacked rows, a table forming. */
export function IconTable(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M8 11.8h8" />
      <path d="M8 14.6h8" />
      <path d="M8 17.4h5" />
      <path d="M12 11.8v5.6" opacity=".55" />
    </Frame>
  );
}

/** Answers at night — a crescent standing in the doorway. */
export function IconNight(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M14.8 14.6a3.6 3.6 0 1 1-3.9-3.6 2.8 2.8 0 0 0 3.9 3.6z" />
    </Frame>
  );
}

/** Remembers corrections — a loop returning on itself. */
export function IconLearns(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M15.4 13.4a3.6 3.6 0 1 0 .5 3.1" />
      <path d="M15.6 10.8v2.8h-2.8" />
    </Frame>
  );
}

/** Build / assemble — a spark forming inside the doorway. Replaces the stock
 *  "AI sparkle", which every product in the category already uses. */
export function IconBuild(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M12 11v6" />
      <path d="M9 14h6" />
      <path d="M9.9 11.9l4.2 4.2" opacity=".5" />
      <path d="M14.1 11.9l-4.2 4.2" opacity=".5" />
    </Frame>
  );
}

export const brandIcons = {
  channels: IconChannels,
  voicePhoto: IconVoicePhoto,
  memory: IconMemory,
  languages: IconLanguages,
  knows: IconKnows,
  handoff: IconHandoff,
  booking: IconBooking,
  table: IconTable,
  night: IconNight,
  learns: IconLearns
} as const;

export type BrandIconKey = keyof typeof brandIcons;

/** Answers around the clock across messengers — three arcs leaving the door. */
export function IconChannels(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M8.4 13.2h7.2" />
      <path d="M8.4 16h4.6" />
      <path d="M12 10.4v.9" opacity=".5" />
    </Frame>
  );
}

/** Understands voice notes and photos — a waveform beside a frame. */
export function IconVoicePhoto(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M9 12.6v3.4" />
      <path d="M11 11.2v6.2" />
      <path d="M13 12.9v2.8" />
      <path d="M15 11.8v5" />
    </Frame>
  );
}

/** Remembers the thread — a spiral that keeps its centre. */
export function IconMemory(props: IconProps) {
  return (
    <Frame {...props}>
      <circle cx="12" cy="14.4" r="1.2" />
      <path d="M12 11.3a3.1 3.1 0 1 1-3.1 3.1" />
      <path d="M12 11.3V10" opacity=".5" />
    </Frame>
  );
}

/** Speaks more than one language — two strokes meeting. */
export function IconLanguages(props: IconProps) {
  return (
    <Frame {...props}>
      <path d="M8.6 11.6h5" />
      <path d="M11.1 10.6v1" />
      <path d="M12.6 11.6c-.4 2.4-2 4.2-4 5" />
      <path d="M9.8 13.6c.7 1.6 2 2.6 3.6 3" />
      <path d="M13.2 17.4l2-4 2 4" />
      <path d="M13.9 16h2.6" opacity=".55" />
    </Frame>
  );
}
