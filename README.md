# Khalil Alblushi — Portfolio

Bilingual (English / Arabic) portfolio. "From Idea to Launch" on the surface, "X-Ray mode" underneath.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/en` or `/ar` based on your browser language.

## Where things live

| Path | What |
|---|---|
| `docs/design-brief.md` | The design system: concept, colors, fonts, motion |
| `docs/backlog.md` | Iterations and decision log |
| `src/app/[lang]/dictionaries/` | All text, `en.json` and `ar.json` |
| `src/app/globals.css` | Design tokens, themes, X-Ray, transitions |
| `src/components/showcase.tsx` | The live hero demo and story rail |
| `src/components/process-scenes.tsx` | The four Process scenes (chat, design, code, launch) |
| `src/components/process-story.tsx` | Scroll engine for the Process section |
| `src/components/work.tsx` | Work case studies and the government diagram |
| `src/assets/work/` | Project screenshots |
| `src/components/xray-inspector.tsx` | X-Ray HUD, measuring box, keyboard shortcuts |
| `src/components/nav-tools.tsx` | X-Ray, language and theme switches |
| `src/components/contact.tsx` | Contact section and footer |
| `src/lib/site.ts` | Site address, email, WhatsApp, social links |
| `scripts/og/` | Share-preview images (template + renderer) |
| `src/proxy.ts` | Picks the visitor's language |

## Dev tip
If a CSS change doesn't show up, stop the server, delete `.next`, and run `npm run dev` again (Turbopack sometimes caches the stylesheet).

## Site address
Until the custom domain exists, links in search results and share previews use Vercel's production address automatically. Once you have a domain, set `NEXT_PUBLIC_SITE_URL` (for example `https://khalil.om`) in Vercel's environment variables.

## Share previews
The images shown when the site is shared (WhatsApp, LinkedIn, X) live in `public/og/`. To change them, edit `scripts/og/template.html` and run:

```bash
node --experimental-websocket scripts/og/render.mjs
```

(Needs Google Chrome. On Node 22+ the flag isn't needed.)
