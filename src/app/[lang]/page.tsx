import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Contact, Footer } from "@/components/contact";
import { Intro } from "@/components/intro";
import { LocalTime } from "@/components/local-time";
import { Logo } from "@/components/logo";
import { NavTools } from "@/components/nav-tools";
import { Scene } from "@/components/process-scenes";
import { ProcessStory } from "@/components/process-story";
import { Sky } from "@/components/sky";
import { OrderDemo, ShowcaseProvider, StoryRail } from "@/components/showcase";
import { GovCase, MatchaCase, NextCase } from "@/components/work";
import { isLocale } from "@/lib/i18n";
import { EMAIL, GITHUB, LINKEDIN, SITE_URL, whatsappLink } from "@/lib/site";
import { getDictionary } from "./dictionaries";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const whatsapp = whatsappLink(t.hero.whatsappMessage);
  const name = lang === "ar" ? "خليل البلوشي" : "Khalil Alblushi";

  // Tells search engines who this site is about.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    alternateName: lang === "ar" ? "Khalil Alblushi" : "خليل البلوشي",
    jobTitle: lang === "ar" ? "مهندس برمجيات" : "Software Engineer",
    url: `${SITE_URL}/${lang}`,
    email: `mailto:${EMAIL}`,
    address: { "@type": "PostalAddress", addressLocality: "Muscat", addressCountry: "OM" },
    knowsLanguage: ["ar", "en"],
    sameAs: [GITHUB, LINKEDIN],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <Sky />
      <Intro />
      <header className="nav">
        <nav className="container nav-inner">
          <Link href={`/${lang}`} className="brand" aria-label={t.nav.home}>
            <Logo className="brand-mark" />
            <span className="hidden sm:inline">{name}</span>
          </Link>

          <div className="nav-links">
            <a className="nav-link" href="#work">
              {t.nav.work}
            </a>
            <a className="nav-link" href="#process">
              {t.nav.process}
            </a>
            <a className="nav-link" href="#contact">
              {t.nav.contact}
            </a>
          </div>

          <NavTools lang={lang} labels={t.nav} />
        </nav>
      </header>

      <main id="main">
        <ShowcaseProvider className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-meta fade-up">
                <span className="inline-flex items-center text-ink">
                  <span className="status-dot" aria-hidden="true" />
                  {t.hero.status}
                </span>
                <span className="meta-sep" aria-hidden="true" />
                <span>{t.hero.location}</span>
                <span className="meta-sep hidden min-[440px]:inline-block" aria-hidden="true" />
                <span className="hidden min-[440px]:inline">
                  <LocalTime />
                </span>
              </p>

              <h1 className="hero-title">
                <span className="title-line">
                  <span>{t.hero.line1}</span>
                </span>
                <span className="title-line">
                  <span>
                    {t.hero.line2}
                    <span className="caret" aria-hidden="true" />
                  </span>
                </span>
              </h1>

              <p className="hero-intro fade-up" style={{ animationDelay: "380ms" }}>
                {t.hero.intro}
              </p>

              <div className="hero-ctas fade-up" style={{ animationDelay: "480ms" }}>
                <a className="btn-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  {t.hero.ctaPrimary}
                  <span className="btn-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </a>
                <a className="btn-text" href="#work">
                  {t.hero.ctaSecondary}
                </a>
              </div>
            </div>

            <div className="fade-up" style={{ animationDelay: "260ms" }}>
              <OrderDemo lang={lang} t={t.demo} />
            </div>
          </div>

          <div className="container">
            <StoryRail chapters={t.chapters} />
          </div>
        </ShowcaseProvider>

        <section id="work" className="work">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow mono" data-reveal>
                {t.work.eyebrow}
              </p>
              <h2 className="section-title" data-reveal>
                <span className="title-line">
                  <span>{t.work.line1}</span>
                </span>
                <span className="title-line">
                  <span>{t.work.line2}</span>
                </span>
              </h2>
              <p className="section-intro" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
                {t.work.intro}
              </p>
            </header>

            <div className="cases">
              <MatchaCase lang={lang} t={t.work} />
              <GovCase lang={lang} t={t.work} />
              <NextCase t={t.work} whatsapp={whatsapp} />
            </div>
          </div>
        </section>

        <ProcessStory id="process" className="process">
          <div className="container">
            <header className="section-head">
              <p className="eyebrow mono" data-reveal>
                {t.process.eyebrow}
              </p>
              <h2 className="section-title" data-reveal>
                <span className="title-line">
                  <span>{t.process.line1}</span>
                </span>
                <span className="title-line">
                  <span>{t.process.line2}</span>
                </span>
              </h2>
              <p className="section-intro" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
                {t.process.intro}
              </p>
            </header>

            <div className="process-body">
              <ol className="steps" data-steps>
                {t.process.steps.map((step, i) => (
                  <li key={step.title} id={`step-${i}`} className="step" data-step={i} data-current={i === 0 ? "" : undefined}>
                    <div className="step-inner">
                      <p className="step-label">
                        <span className="step-num mono">0{i}</span>
                        <span>{t.chapters[i].label}</span>
                      </p>
                      <h3 className="step-title">{step.title}</h3>
                      <p className="step-body">{step.body}</p>
                      <dl className="step-facts">
                        <div>
                          <dt>{t.process.youGet}</dt>
                          <dd>{step.deliverable}</dd>
                        </div>
                        <div>
                          <dt>{t.process.yourPart}</dt>
                          <dd>{step.yourPart}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="step-scene" aria-hidden="true">
                      <Scene index={i} lang={lang} t={t.process} demo={t.demo} />
                    </div>
                  </li>
                ))}
              </ol>

              <div className="process-stage" data-stage aria-hidden="true">
                <div className="stage-sticky">
                  <div className="stage-stack">
                    {t.process.steps.map((step, i) => (
                      <Scene key={step.title} index={i} current={i === 0} lang={lang} t={t.process} demo={t.demo} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProcessStory>

        <Contact t={t.contact} whatsapp={whatsapp} />
      </main>

      <Footer t={t.footer} name={name} />

    </>
  );
}
