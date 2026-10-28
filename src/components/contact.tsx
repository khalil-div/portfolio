import type { CSSProperties } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { EMAIL, GITHUB, LINKEDIN } from "@/lib/site";
import { CopyEmail } from "./copy-email";
import { LocalTime } from "./local-time";
import { Logo } from "./logo";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const OUT = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function Contact({ t, whatsapp }: { t: Dictionary["contact"]; whatsapp: string }) {
  return (
    <section id="contact" className="contact">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow mono" data-reveal>
            {t.eyebrow}
          </p>
          <h2 className="section-title" data-reveal>
            <span className="title-line">
              <span>{t.line1}</span>
            </span>
            <span className="title-line">
              <span>{t.line2}</span>
            </span>
          </h2>
          <p className="section-intro" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
            {t.intro}
          </p>
        </header>

        <div className="contact-grid">
          <a
            className="contact-card contact-wa"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            data-reveal
           
          >
            <span className="contact-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1L4 20Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 9.2c0 2.9 2.4 5.6 5.4 5.8.5 0 1.3-.6 1.3-1.2 0-.3-1.3-.9-1.6-.9-.3 0-.6.5-.9.5-.8 0-2.3-1.5-2.3-2.3 0-.3.5-.6.5-.9 0-.3-.6-1.6-.9-1.6-.6 0-1.5.6-1.5 1.1"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="contact-title">{t.whatsappTitle}</span>
            <span className="contact-body">{t.whatsappBody}</span>
            <span className="contact-cta">
              {t.whatsappCta}
              <span className="btn-arrow">{ARROW}</span>
            </span>
          </a>

          <div className="contact-card contact-mail" data-reveal style={{ "--d": "120ms" } as CSSProperties}>
            <span className="contact-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="contact-title">{t.emailTitle}</span>
            <a className="mail-address" href={`mailto:${EMAIL}`} dir="ltr">
              {EMAIL}
            </a>
            <CopyEmail email={EMAIL} copy={t.copy} copied={t.copied} />
          </div>
        </div>

        <div className="contact-meta" data-reveal>
          <p className="contact-time">
            <span className="status-dot" aria-hidden="true" />
            {t.local} <LocalTime />
          </p>
          <p className="contact-links">
            <span>{t.elsewhere}</span>
            <a className="btn-text" href={GITHUB} target="_blank" rel="noopener noreferrer" dir="ltr">
              GitHub {OUT}
            </a>
            <a className="btn-text" href={LINKEDIN} target="_blank" rel="noopener noreferrer" dir="ltr">
              LinkedIn {OUT}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer({ t, name }: { t: Dictionary["footer"]; name: string }) {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p className="footer-brand">
          <Logo className="brand-mark" />
          <span>
            © {name}
            <span className="footer-built">{t.built}</span>
          </span>
        </p>
        <a className="btn-text footer-top" href="#main">
          {t.top} ↑
        </a>
      </div>
    </footer>
  );
}
