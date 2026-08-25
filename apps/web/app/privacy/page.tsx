import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  OPERATOR_LEGAL_NAME, PRIVACY_EFFECTIVE, PRIVACY_UPDATED, PRIVACY_VERSION,
  privacyIntro, privacySections, type PrivacyBlock
} from "@/components/privacy-copy";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Как Rezaru собирает, использует и защищает персональные данные владельцев бизнеса и их клиентов.",
  // A privacy policy is a public commitment; it should be indexable, and Meta
  // reads it directly when reviewing access to the Instagram and WhatsApp APIs.
  robots: { index: true, follow: true }
};

function Block({ block }: { block: PrivacyBlock }) {
  if (block.kind === "text") return <p>{block.text}</p>;
  if (block.kind === "list") return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.kind === "definitions") {
    return <dl>{block.items.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.text}</dd></div>)}</dl>;
  }
  return (
    // Five columns of prose on a phone need to scroll rather than crush the
    // page, hence the wrapper.
    <div className="legal-table-wrap">
      <table>
        <thead><tr>{block.head.map((cell) => <th key={cell}>{cell}</th>)}</tr></thead>
        <tbody>{block.rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Logo />
        <h1>Политика конфиденциальности</h1>
        <p className="legal-lead">{privacyIntro}</p>
        <div className="legal-meta">
          <span>Дата вступления в силу: {PRIVACY_EFFECTIVE}</span>
          <span>Последнее обновление: {PRIVACY_UPDATED}</span>
          <span>Редакция: {PRIVACY_VERSION}</span>
        </div>
        {/* Shown only while the operator's legal name is still unset, so the
            gap is visible to us rather than quietly published as fact. */}
        {!OPERATOR_LEGAL_NAME && (
          <p className="legal-notice">
            Реквизиты оператора данных ещё не заполнены. До публикации укажите юридическое название или ФИО индивидуального предпринимателя.
          </p>
        )}
      </header>

      <nav className="legal-toc" aria-label="Разделы">
        {privacySections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
      </nav>

      <article className="legal-body">
        {privacySections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.blocks.map((block, index) => <Block key={index} block={block} />)}
          </section>
        ))}
      </article>

      <footer className="legal-footer">
        <Link href="/">На главную</Link>
        <span>© {new Date().getFullYear()} Rezaru</span>
      </footer>
    </main>
  );
}
