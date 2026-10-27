# Design Brief — Khalil Alblushi Portfolio

**Iteration 0** · Status: awaiting approval · 2026-10-27

---

## 1. Goal

Win **freelance clients** — non-technical business owners first, plus companies that hire programmers for project-based work.
A visitor should leave thinking *"this is the person we're looking for"* and keep remembering the site afterwards.

## 2. Concept — One site, two views

**Surface: "From Idea to Launch"**
A scroll story in four chapters that any business owner understands:

| # | EN | AR | What happens on screen |
|---|----|----|------------------------|
| 00 | Idea | الفكرة | A rough hand-drawn sketch of a product appears |
| 01 | Design | التصميم | The sketch cleans up into a polished interface |
| 02 | Build | البناء | The interface comes alive — a product is added to a cart |
| 03 | Launch | الإطلاق | A phone receives a real WhatsApp order |

The story is literally Matcha Muse's story — the best project becomes the demo.

**Underneath: "X-Ray mode"** (signature moment)
A switch labeled **"See how it's built / شوف كيف انبنى"**. When on, the whole site transforms:
- Cards and images dissolve into wireframes and blueprint lines
- Labels reveal real structure: `<Hero />`, `POST /api/orders`, `PostgreSQL`, `Docker`
- The four chapters re-label as layers: **Interface → Logic → Database → Server**
- Turning it off reassembles everything smoothly

Non-technical clients never need it. Technical visitors flip it and see the full system.

## 3. Principles

1. **One star.** X-Ray mode is the only "wow". Everything else is calm and polished.
2. **Motion explains.** Every animation shows where something came from or where you're going. No decoration-only motion.
3. **Equal languages.** Arabic and English are designed together — neither is a translation of the other.
4. **Equal themes.** Light and dark each get full design attention.
5. **Clear in 5 seconds.** Who Khalil is, what he does, how to contact him.
6. **Fast everywhere.** Smooth on a mid-range phone. Only `transform` and `opacity` are animated.
7. **Respectful.** Full support for "reduce motion", keyboard and screen readers.

## 4. Color

### Light — "Muscat day"
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F3EEE4` | Page background (warm sand) |
| `--surface` | `#FBF8F2` | Cards, panels |
| `--ink` | `#16201C` | Main text |
| `--muted` | `#5E675F` | Secondary text |
| `--line` | `#DCD3C3` | Borders, dividers |
| `--accent` | `#3E7B4F` | Matcha green — links, highlights |
| `--xray` | `#2D55C8` | Blueprint ink (X-Ray mode only) |

### Dark — "Muscat night"
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0D1311` | Deep green-black |
| `--surface` | `#141C19` | Cards, panels |
| `--ink` | `#EDE7DA` | Main text (soft cream) |
| `--muted` | `#9AA39B` | Secondary text |
| `--line` | `#25302B` | Borders, dividers |
| `--accent` | `#8FCB7E` | Glowing matcha |
| `--xray` | `#6FD6C4` | Glowing blueprint lines |

Rule: one accent per screen. Color is rare, so it means something.

## 5. Typography

| Role | English | Arabic | Why |
|---|---|---|---|
| UI & body | **Readex Pro** | **Readex Pro** | One family designed for both scripts together — true visual equality |
| Editorial accent (1–2 words per headline) | **Instrument Serif** *italic* | **Amiri** | Adds warmth and craft to key words |
| X-Ray mode / code | **JetBrains Mono** | **IBM Plex Sans Arabic** | Technical, "under the hood" voice |

Scale (fluid, desktop → mobile): Display 96→48 · H1 56→36 · H2 36→26 · Body 18→16 · Small 14.
Arabic gets +8–10% line-height and is never letter-spaced.

## 6. Motion system

| Name | Duration | Use |
|---|---|---|
| `instant` | 150 ms | Hover, press |
| `quick` | 300 ms | Toggles, menus |
| `smooth` | 600 ms | Section reveals |
| `story` | 900 ms+ | Chapter transitions, X-Ray transform |

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (soft, confident stop). No bounce.
- Reveals: fade + 16px rise, staggered 60 ms.
- Language switch: text dissolves and re-forms, layout glides to its mirrored side.
- Theme switch: a slow "sunset" color crossfade (~700 ms), never a flash.
- Smooth scrolling via Lenis. Scroll story via GSAP ScrollTrigger.
- `prefers-reduced-motion`: all movement becomes simple crossfades.

## 7. Site structure

1. **Nav** — `KA` monogram · Work · Process · Contact · language · theme · X-Ray switch
2. **Hero** — "You have the idea. I build everything else." / «الفكرة منك، والباقي عليّ.»
3. **Story** — the four chapters (Idea → Design → Build → Launch)
4. **Work** — Matcha Muse (live, phone mockups) · Government multi-tenant platform (architecture diagrams, "a government entity", no screenshots) · room for new projects
5. **What I do** — Websites · Web apps & dashboards · Online ordering · Hosting & deployment
6. **How I work** — short process + this portfolio's own build log (case study)
7. **Contact** — "Let's build yours." · WhatsApp button · email copies on click with a small friendly message

## 8. Contact details

- Email: `xkhalilalblushi@gmail.com`
- WhatsApp: button only (`wa.me/96894435394`) — number never shown as plain text
- GitHub: `github.com/khalil-div` · LinkedIn: `linkedin.com/in/khalil-al-blushi`

## 9. Tech

Next.js (App Router) · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Lenis · Motion (micro-interactions) · next-intl (`/en`, `/ar`, auto-detected) · next-themes · Vercel.

## 10. Definition of Done (every section)

- [ ] Looks and reads beautifully in **Arabic and English**
- [ ] Looks beautiful in **light and dark**
- [ ] Works on **phone, tablet, desktop**
- [ ] Has an **X-Ray** state
- [ ] Animations smooth (60 fps) and respect reduce-motion
- [ ] Keyboard-accessible, readable contrast
- [ ] Reviewed and approved by Khalil

## 11. Open points for review

- Arabic copy is a draft — Khalil (native) to refine tone.
- Final accent green to be confirmed on screen in the prototype.
