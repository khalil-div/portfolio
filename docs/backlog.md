# Backlog

Lightweight iterative process: one backlog, short iterations, a review after each.
A section is done only when it meets the Definition of Done in `design-brief.md`.

| # | Iteration | Status |
|---|-----------|--------|
| 0 | Design brief + style board | ✅ Reviewed (palette and serif accent rejected → redesigned) |
| 1 | Prototype: hero, live demo, language switch, theme switch, X-Ray | ✅ Approved |
| 2 | Process: four chapters scrubbed by scroll (GSAP ScrollTrigger + Lenis) | ✅ Approved (promises removed) |
| 3 | Work: Matcha Muse + government platform case studies | ✅ Approved |
| 4 | X-Ray inspector: live HUD, hover measuring, spacing rulers, X / Esc shortcuts, first-visit hint | ✅ Approved |
| 5 | Polish: contact + footer, share previews, SEO, accessibility, performance | ✅ Approved |
| 6 | Launch on Vercel: https://khalil-alblushi.vercel.app | ✅ Live |
| 7 | Clean slate: remove X-Ray completely | ✅ Ready for review |
| 8 | Golden hour I: living sky, Hajar mountains, scroll = a day in Muscat, real-time opening, cards catch the light | ⏳ Next |
| 9 | Golden hour II: night finale in Contact (stars, moon, city lights) | |
| 10 | The lens: magnifier in the hero demo shows the sketch underneath | |
| 11 | Signature: name drawn in Arabic, turns into English (first visit, < 1.5 s) | |
| 12 | Quality pass, new share images, launch | |

## Later
- Add new projects as they're finished
- Connect a custom domain
- "How I built this portfolio" case study
- Review all wording in both languages (Khalil)
- Confirm the Matcha Muse story and the government platform description are OK to publish (Khalil)

## Decision log
| Date | Decision |
|------|----------|
| 2026-10-27 | Main goal: freelance clients (non-technical + project-based company work) |
| 2026-10-27 | Concept: "From Idea to Launch" surface + "X-Ray mode" underneath |
| 2026-10-27 | Arabic and English equal; language follows a saved choice, then the browser |
| 2026-10-27 | Light and dark equal; follows the device until the visitor picks one |
| 2026-10-27 | No photo, no phone number shown; WhatsApp button + email |
| 2026-10-27 | Government project shown as "a government entity", diagrams only |
| 2026-10-27 | Deploy on Vercel; domain later |
| 2026-10-27 | Matcha green palette rejected → monochrome + signal orange; X-Ray = blueprint / scope |
| 2026-10-27 | Serif accent fonts (Instrument Serif / Amiri) rejected → Readex Pro only, emphasis by contrast |
| 2026-10-27 | Headline: "You bring the idea. I build the rest." / «الفكرة منك، والباقي عليّ.» |
| 2026-10-27 | Hero demo: fictional café "Dar Karak" plays the four chapters live |
| 2026-10-27 | Language switch is a full navigation (keeps theme + X-Ray reliable) with a cross-document fade |
| 2026-10-28 | Iteration 1 approved |
| 2026-10-28 | Process = the same Dar Karak project told in depth: chat → design → code → live dashboard |
| 2026-10-28 | Scroll animation is scrubbed (moves with the reader), not timed; sticky stage on desktop, inline scenes on phones |
| 2026-10-28 | Smooth wheel scrolling (Lenis); touch stays native; both off with reduced motion |
| 2026-10-28 | No fixed price or timelines anywhere: they vary by project and availability. "Time" → "Your part" |
| 2026-10-28 | Work comes right after the hero (proof first); Process follows |
| 2026-10-28 | Matcha Muse shown with real screenshots: laptop in the page's language, phone in the other |
| 2026-10-28 | Government platform shown as a live diagram (departments → sign-in → platform → separate data), no names or screenshots |
| 2026-10-28 | X-Ray gets a one-time hint (after the hero demo plays once) so clients discover it |
| 2026-10-28 | X toggles X-Ray, Esc exits; uses the physical key so it works on Arabic keyboards |
| 2026-10-28 | Contact: WhatsApp (primary) + email with copy button; GitHub and LinkedIn; no reply-time promise |
| 2026-10-28 | Share previews rendered from HTML with real fonts (Arabic shaping stays correct), one per language |
| 2026-10-28 | Chat scene animates with transforms only, so scrolling causes zero layout shift |
| 2026-10-28 | Code public at github.com/khalil-div/portfolio; every push to main deploys to production |
| 2026-10-28 | Address: khalil-alblushi.vercel.app until a custom domain is bought |
| 2026-10-28 | X-Ray removed: a separate mode that was uncomfortable to look at ("I want to switch back"). Code stays in git history |
| 2026-10-28 | New direction: Golden hour in Muscat (atmosphere) + the lens (hidden delight) + signature intro |
| 2026-10-28 | New work happens on the `golden-hour` branch with Vercel preview links; main (live) changes only after approval |
