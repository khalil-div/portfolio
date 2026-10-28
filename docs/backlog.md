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
| 7 | Clean slate: remove X-Ray completely | ✅ Done |
| 8 | Golden hour I: living sky, Hajar mountains, scroll = a day in Muscat, real-time opening, cards catch the light | ✅ Approved |
| 9 | Golden hour II: night finale (city lights in the valley, city glow, shooting star, ending shot) | ✅ Approved |
| 10 | The lens: magnifier over the hero card shows its wiring; one live code label for the part under the pointer | ✅ Approved |
| 11 | Logo + loading screen: "k." (the full stop is the orange sun); writes itself, the sun rises, then flies into the header (first visit, 1.5 s) | ✅ Approved |
| 12 | Quality pass, new share images, launch | ✅ Live |

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
| 2026-10-28 | The sun follows Muscat's real path: rises on the right (east), sets on the left (west), heights measured from the mountains' horizon |
| 2026-10-28 | Opening sky = real Muscat time; Work carries it to morning by the shortest way round the clock (evening visitors see a sunrise) |
| 2026-10-28 | `?hour=21` previews any time of day |
| 2026-10-28 | Review: bodies behind small text felt too strong, and day↔night seemed to jump. Sun and moon now share one east→west arc with their own glows; discs are sharp only just above the ridges and dissolve as they climb; night falls over ~2 screens |
| 2026-10-28 | City lights sit in the valley between the middle and front ridges (some hidden by the foothills); they switch on as the sun nears the mountains |
| 2026-10-28 | The page ends on an "ending shot": space below the footer so the city is never under text |
| 2026-10-28 | The lens shows a wireframe twin of the card (same markup and live state), magnified 12%; only the part under the pointer is labelled, below the lens |
| 2026-10-28 | On touch the lens opens after a 0.32 s hold and floats above the fingertip like a text loupe; a quick swipe still scrolls |
| 2026-10-28 | Signature ends in the visitor's language: /en draws Arabic → English, /ar draws English → Arabic. Readex Pro outlines shaped with HarfBuzz (scripts/signature/name.py) |
| 2026-10-28 | Intro decided before first paint (first visit, not reduced motion); skippable; removes itself after 3 s if anything fails; `?intro` replays |
| 2026-10-28 | Name signature rejected ("I prefer a logo"). Four concepts shown (خ with a sun, KA sunrise, K + caret, code horizon); Khalil chose **D: code horizon** |
| 2026-10-28 | Logo used for the header, footer, loading screen, browser tab and iPhone icon. The loading screen's logo lands on the header's |
| 2026-10-28 | Code-horizon logo didn't feel right in place. Switched to the recommendation, **A: خ with a sun** (Readex Pro خ; its dot enlarged 1.4× and orange so it reads as a sun even at 16 px). Generated by scripts/logo/khah.py |
| 2026-10-28 | Arabic letter rejected ("I don't like it Arabic"). Four English candidates built into the site and compared in place; Khalil chose **E1: "k."**, a lowercase k whose full stop is the orange sun, finishing the headline "I build the rest." Generated by scripts/logo/mark.py |
| 2026-10-28 | Share images: a sunset over the Hajar ridges with the city lights, the "k." logo, and the headline's full stop in the logo's orange |
| 2026-10-28 | Sky performance: per-frame positions/opacities written directly to the moving elements (no inherited variables), colours in ~250 steps per day, ridges/city on their own layers. Style work while scrolling −32% |
| 2026-10-28 | Fixed: lens twin and resting lens rim widened the page on phones; single-column grids couldn't shrink at 320 px; duplicate SVG id in the café card |
| 2026-10-29 | Golden hour, lens, "k." logo and loading screen live on khalil-alblushi.vercel.app (main fast-forwarded from golden-hour) |
| 2026-10-29 | Phone hero: poster headline (each sentence in two balanced lines, ~60 px), full-width "Start a project" button, compact demo card. Laptop layout unchanged |
