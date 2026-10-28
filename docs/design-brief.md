# Design Brief — Khalil Alblushi Portfolio

**Iteration 7** · Status: X-Ray removed; Golden hour in progress · 2026-10-28

---

## 1. Goal

Win **freelance clients**: non-technical business owners first, plus companies that hire programmers for project-based work.
A visitor should leave thinking *"this is the person we're looking for"* and keep remembering the site afterwards.

## 2. Concept: one site, two views

**Surface: "From Idea to Launch"**, a story in four chapters any business owner understands:

| # | EN | AR |
|---|----|----|
| 00 | Idea | الفكرة |
| 01 | Design | التصميم |
| 02 | Build | البناء |
| 03 | Launch | الإطلاق |

The hero plays the whole story in ~9 seconds with a live ordering card for a fictional Muscat café, **Dar Karak**:
a pencil sketch (idea) → a polished card (design) → someone picks a size and orders (build) → the shop gets an order notification (launch).
The story rail under the hero fills in step by step.

**Atmosphere: "Golden hour in Muscat"** (replaces X-Ray, which was removed on 2026-10-28: a separate mode that made the page harder to look at).
The page is lit like a day passing in Muscat, with a fine line drawing of the Hajar mountains behind everything. Scrolling moves the light:

| Where | Time of day |
|---|---|
| Hero | The real time in Muscat (night visitors arrive under the night sky) |
| Work | The sky moves forward to morning |
| 00 Idea → 03 Launch | Morning → midday → late afternoon → sunset |
| Contact + footer | Night: stars, moon, city lights at the foot of the mountains |

Cards catch the light: their shadows and highlights follow the sun.

**Hidden delight: the lens.** Over the hero demo card, the cursor carries a soft magnifier that shows the sketch and wiring underneath (press-and-hold on phones). Optional, found by accident.

**First second: the signature.** On the first visit, the name draws itself in Arabic strokes, turns into English, and the page settles in (under 1.5 s).

## 3. Principles

1. **Atmosphere, not effects.** The light is the "wow"; it must stay comfortable to look at for minutes.
2. **Motion explains.** Every animation shows where something came from or where it goes.
3. **Equal languages.** Arabic and English designed together; neither is a translation.
4. **Equal themes.** Light and dark each get full design attention.
5. **Clear in 5 seconds.** Who Khalil is, what he does, how to contact him.
6. **Fast everywhere.** Only `transform` and `opacity` animate; the demo pauses off-screen.
7. **Respectful.** Reduced-motion support, keyboard focus, readable contrast.

## 4. Color

Mostly monochrome with **one signal color**: a warm orange (a nod to Muscat sunsets, and the color engineers use for "look here").

### Light: "Paper"
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F5F4F0` | Warm bone paper |
| `--surface` | `#FFFFFF` | Cards |
| `--ink` | `#0F0F10` | Text |
| `--muted` | `#69675F` | Secondary text |
| `--line` | `#E2E0D9` | Borders |
| `--accent` | `#FF4F17` | Signal orange |

### Dark: "Ink"
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0B0B0C` | Near-black |
| `--surface` | `#141416` | Cards |
| `--ink` | `#F2F1EC` | Soft white text |
| `--muted` | `#8F8D86` | Secondary text |
| `--line` | `#242427` | Borders |
| `--accent` | `#FF5A24` | Signal orange |

A subtle film grain sits over every theme to keep flat color from feeling sterile.

## 5. Typography

| Role | Font | Notes |
|---|---|---|
| Everything (EN + AR) | **Readex Pro** | One family drawn for both scripts. EN headlines 500 with tight tracking; AR headlines 600, never letter-spaced |
| Technical details | **JetBrains Mono** + **IBM Plex Sans Arabic** | Arabic falls back to Plex automatically |

The serif accent from Iteration 0 was **removed** after review. Emphasis now comes from contrast: the first sentence muted, the second full ink, plus an orange typing caret.

The hero headline is sized to its column (container units), so each sentence always holds exactly one line on any screen.

## 6. Motion system

| Name | Duration | Use |
|---|---|---|
| `instant` | 150 ms | Hover, press |
| `quick` | 300 ms | Toggles |
| `smooth` | 600 ms | Reveals |
| `story` | 900 ms | Headline rise, section titles |

- Easing `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce.
- **Theme switch:** the new theme grows in a circle from the button (View Transitions API).
- **Language switch:** a soft blur-fade between `/en` and `/ar` (cross-document view transition).
- Browsers without View Transitions simply switch instantly; reduced-motion users get a static, finished demo.

## 7. Site structure (target)

1. **Nav**: KA mark · Work · Process · Contact · language · theme ✅
2. **Hero**: status + live Muscat time, headline, intro, WhatsApp CTA, live demo, story rail ✅
3. **Work** ✅: "Real projects. Real people using them."
   - 01 Matcha Muse: real screenshots (laptop + phone, one per language), what was built, role, stack, link to the live site.
   - 02 Government platform: an animated diagram of requests flowing from each department through sign-in and the shared platform into that department's own data. Private, so no names or screenshots.
   - 03 "Your project could be next." with the WhatsApp button.
4. **Process** ✅: "Four steps. No surprises." Each chapter states what the client gets and what their part is (no prices or timelines: they vary by project), and is told through Dar Karak:
   - 00 a WhatsApp-style chat that turns into a one-page plan
   - 01 a wireframe scanned into the finished design, then approved
   - 02 the order API typing itself in, with a ticking checklist and weekly preview
   - 03 the live site: orders and visitors counting up, a sales line drawing itself, a new order arriving

   Desktop: the chapters scroll past a sticky stage, with a progress line whose head sits at mid-screen. Phones: each chapter carries its own scene.
5. **Contact** ✅: "Got an idea? Let's talk about it." WhatsApp card (primary), email card with copy button, Muscat local time, GitHub and LinkedIn.
6. **Footer** ✅: name, "designed and built by Khalil, in Muscat", back to top.

## 8. Contact

- Email: `xkhalilalblushi@gmail.com`
- WhatsApp: button with a pre-filled message in the visitor's language; the number is never shown as text
- GitHub `github.com/khalil-div` · LinkedIn `linkedin.com/in/khalil-al-blushi`

## 9. Tech

Next.js 16 (App Router, Cache Components, static `/en` + `/ar`) · TypeScript · Tailwind CSS 4 · View Transitions API · `next/font`.
Language is detected from a saved choice, then the browser's `Accept-Language` (`src/proxy.ts`).
Scroll story: GSAP ScrollTrigger writes progress to CSS variables; CSS does the animating. Lenis smooths wheel scrolling.

## 10. Quality (measured 2026-10-28, production build)

Throttled mid-range phone (slow 4G, 4× CPU slowdown):

| | English | Arabic | Google's "good" |
|---|---|---|---|
| Largest content painted | 1.1 s | 1.2 s | under 2.5 s |
| Layout shift (load + full scroll) | 0 | 0 | under 0.1 |
| Page weight | 450 KB | 451 KB | |

Accessibility: one h1, no skipped heading levels, every link and button named, no duplicate ids, skip link, visible focus ring, reduced-motion support.

Search and sharing: per-language title, description, canonical and hreflang (with x-default), Open Graph and Twitter cards with a preview image per language, robots.txt, sitemap.xml with language alternates, Person structured data, icon and Apple touch icon.

## 11. Definition of Done (every section)

- [ ] Arabic and English
- [ ] Light and dark
- [ ] Phone, tablet, desktop
- [ ] Looks right at every time of day (morning → night)
- [ ] Smooth, and respects reduced motion
- [ ] Keyboard-accessible, readable contrast
- [ ] Approved by Khalil

## 12. Open points

- Arabic and English wording: Khalil to review later.
- "Dar Karak" is a fictional demo shop; it can be swapped for a real client later.
