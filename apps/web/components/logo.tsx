import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link className="brand" href={href} aria-label="Rezaru home">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-text">Rez<span>aru</span></span>
    </Link>
  );
}
