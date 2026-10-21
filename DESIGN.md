# 4OUR Estate design system

The living reference is `/styleguide`. It renders the real components with fixture data, so if this document and the page disagree, the page is right and this document is stale.

## Philosophy

Archetype: **Workbench**. The site should feel like a tool a sharp developer built for people hunting for a home in the Philippines: honest numbers, clear labels, a little play in the margins. Photography still sells the house, but the interface around it is direct, legible and a bit opinionated, not a hushed luxury brochure.

Four rules decide most arguments:

1. **Readable first.** Every typeface is chosen to be read at its size. No hairline display faces, no decoration that costs legibility.
2. **Show the data.** Prices, areas, counts and dates are first-class. Spec sheets, charts and tables are part of the look, set in mono and condensed figures.
3. **Two colours with jobs.** Kahel orange marks the one thing to press or notice. Sky is the calm field that holds the page. Everything else is paper and ink.
4. **Personality in the margins.** Dither, ASCII, blueprint grids and a rotating stamp add character around the content, never on top of it. Motion is short and purposeful.

## Palette

Off-white paper, warm ink, Kahel orange and a Manila-morning sky. The tokens live in `src/app/globals.css` under `@theme`. `--color-*: initial` clears Tailwind's default palette, so only these colours exist.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | #f4f2ec | Canvas |
| `paper-raised` | #ffffff | Cards, panels, fields |
| `paper-sunken` | #e8e5dc | Wells, skeletons, the dashboard frame |
| `ink` | #151411 | Headings, body, primary buttons, solid chips |
| `ink-soft` | #3e3c36 | Secondary copy |
| `ink-muted` | #66635a | Meta, captions, labels |
| `night` | #121110 | Search bar, data and map panels, toasts |
| `night-raised` | #1e1d1a | Panels on night |
| `on-night` | #f2f0ea | Text on night |
| `on-night-muted` | #a5a299 | Meta on night |
| `accent` | #ff5a1f | Kahel orange. Fills, marks, highlighter, active states. Ink text only on top |
| `accent-ink` | #b83d0e | Orange as text, links and the focus ring |
| `accent-soft` | #ff8a5c | Orange on night |
| `sky` | #cfe9f1 | Hero and page-header fields |
| `sky-soft` | #e6f4f8 | Quiet bands, chips |
| `sky-deep` | #1f5f7a | Dither ink, meters, light-on-dark chips |
| `sun` | #f3d34a | Chart bars, review states, focus ring on bay |
| `bay` | #1d44c8 | Manila Bay cobalt. The footer field. Paper, sky and sun read on it; orange only as a fill |
| `positive` | #256b42 | Published, answered |
| `danger` | #b42318 | Errors |

### Contrast

Computed by `npx tsx scripts/design/check-tokens.ts`, which parses `globals.css` and applies the WCAG 2.x relative-luminance formula. The script exits non-zero if any pair drops below its threshold. The styleguide palette section computes the same numbers live from the same file.

| Foreground | Background | Ratio | Needs | Role |
| --- | --- | --- | --- | --- |
| `ink` #151411 | `paper` #f4f2ec | 16.45:1 | 4.5:1 pass | Body and headings |
| `ink-soft` #3e3c36 | `paper` #f4f2ec | 9.85:1 | 4.5:1 pass | Secondary copy |
| `ink-muted` #66635a | `paper` #f4f2ec | 5.36:1 | 4.5:1 pass | Meta, captions, eyebrows |
| `ink-muted` #66635a | `paper-raised` #ffffff | 6.00:1 | 4.5:1 pass | Meta inside panels |
| `ink-muted` #66635a | `paper-sunken` #e8e5dc | 4.77:1 | 4.5:1 pass | Meta on sunken wells |
| `accent-ink` #b83d0e | `paper` #f4f2ec | 5.05:1 | 4.5:1 pass | Orange text, links |
| `accent-ink` #b83d0e | `paper-raised` #ffffff | 5.66:1 | 4.5:1 pass | Orange text in panels |
| `accent-ink` #b83d0e | `paper` #f4f2ec | 5.05:1 | 3:1 pass | Focus ring on paper |
| `ink` #151411 | `accent` #ff5a1f | 5.91:1 | 4.5:1 pass | Labels on orange fills |
| `accent` #ff5a1f | `ink` #151411 | 5.91:1 | 3:1 pass | Orange well on ink buttons |
| `ink` #151411 | `sky` #cfe9f1 | 14.54:1 | 4.5:1 pass | Copy on the sky field |
| `ink-muted` #66635a | `sky` #cfe9f1 | 4.74:1 | 4.5:1 pass | Meta on the sky field |
| `ink-soft` #3e3c36 | `sky-soft` #e6f4f8 | 9.80:1 | 4.5:1 pass | Copy on sky bands |
| `ink` #151411 | `sun` #f3d34a | 12.48:1 | 4.5:1 pass | Labels on review and chart fills |
| `paper` #f4f2ec | `sky-deep` #1f5f7a | 6.30:1 | 4.5:1 pass | Light text on deep sky |
| `paper` #f4f2ec | `ink` #151411 | 16.45:1 | 4.5:1 pass | Primary button label |
| `paper` #f4f2ec | `bay` #1d44c8 | 6.91:1 | 4.5:1 pass | Footer copy |
| `sky` #cfe9f1 | `bay` #1d44c8 | 6.11:1 | 4.5:1 pass | Footer meta |
| `sun` #f3d34a | `bay` #1d44c8 | 5.24:1 | 3:1 pass | Focus ring on bay |
| `on-night` #f2f0ea | `night` #121110 | 16.55:1 | 4.5:1 pass | Overlays and dark panels |
| `on-night-muted` #a5a299 | `night` #121110 | 7.39:1 | 4.5:1 pass | Meta on night |
| `accent-soft` #ff8a5c | `night` #121110 | 8.12:1 | 4.5:1 pass | Accent on night |
| `accent` #ff5a1f | `night` #121110 | 6.05:1 | 3:1 pass | Focus ring on night |
| `positive` #256b42 | `paper` #f4f2ec | 5.75:1 | 4.5:1 pass | Positive status |
| `danger` #b42318 | `paper` #f4f2ec | 5.87:1 | 4.5:1 pass | Field errors |
| `danger` #b42318 | `paper-raised` #ffffff | 6.57:1 | 4.5:1 pass | Field errors in panels |

White `paper` text on `accent` fails (about 2.8:1), so orange fills always carry ink labels. Text over photography sits on a solid chip or card, never on a bare scrim.

## Typography

**Bricolage Grotesque** for display, **Hanken Grotesk** for text and **JetBrains Mono** for labels, data and paths. All three load through `next/font/google` in `src/app/layout.tsx` and map to `font-display`, `font-sans` and `font-mono`.

Why this trio: Bricolage is a grotesque with quirks (ink traps, a lively `a` and `g`) that gives headlines a voice without losing legibility, and its `wdth` axis gives condensed figures for stats and spec sheets from the same family. Hanken is a plain, open grotesque that holds up at 14px. Mono marks anything that is data or system text, which is where the "developer built this" feel comes from. Bodoni Moda was retired because its hairlines vanished at small sizes and read as decoration rather than text.

- **Condensed figures.** `.condensed` sets `font-stretch: 75%`. Use it for big numbers: stat cards, key facts, market figures.
- **Emphasis.** `em` inside a heading renders as an orange highlighter stroke, not italics (Bricolage has no true italic). Change the mark per element with `[--em-mark:…]`. `SplitHeading` marks the word with `*word*`.
- **Peso sign.** ₱ renders in all three faces.

| Token | Size | Leading | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-display-1` | clamp(2.875rem → 6.25rem) | 0.94 | -0.045em | Hero, once per page |
| `text-display-2` | clamp(2.375rem → 4.5rem) | 0.98 | -0.04em | Page and listing titles |
| `text-display-3` | clamp(1.875rem → 3rem) | 1.04 | -0.03em | Section and dashboard headings |
| `text-heading` | clamp(1.375rem → 1.75rem) | 1.15 | -0.02em | Panels, dialogs, feature cards |
| `text-title` | 1.1875rem | 1.3 | -0.015em | Card titles |
| `text-lead` | clamp(1.0625rem → 1.25rem) | 1.55 | 0 | Intros |
| `text-body` | 1rem | 1.65 | 0 | Running text |
| `text-small` | 0.875rem | 1.55 | 0 | Facts, labels, buttons |
| `text-micro` | 0.6875rem | 1.4 | 0.08em | Mono eyebrows and labels |

Rules:

- Headings are weight 600. Body is 400, labels and buttons 600.
- One highlighted word per headline at most.
- Uppercase belongs to `text-micro` and the mono labels.
- Prices and figures use `.tabular` so columns align.
- `h1` to `h4` default to the display face with `text-wrap: balance`, and paragraphs use `pretty`.

## Space, grid and form

- **Spacing.** Tailwind's 4px scale. `Section` defaults to `py-24 md:py-36 lg:py-44`, with `hero`, `tight` and `flush` options. Dense UI (dashboards, filters, spec sheets) uses tighter steps on purpose.
- **Grid.** 12 columns from `md`. Listing grids are even: two columns from `sm`, three from `xl`.
- **Container.** `wide` is 96rem, `default` 80rem, and `prose` 44rem. Gutters are `px-5 sm:px-8 lg:px-12`.
- **Radii.** Small and consistent.
  - `rounded-photo` is 6px for photographs.
  - `rounded-field` is 8px for inputs.
  - `rounded-panel` is 14px for cards, panels, the search bar and dialogs.
  - Buttons, chips and tags use `rounded-md`; icon wells and eyebrows use 4px.
- **Elevation.** `shadow-hairline`, `shadow-lift` and `shadow-float` are soft and ink-tinted. `shadow-block` is a hard 4px ink offset, reserved for things you press, such as the hero spotlight. Property cards animate the same offset through Framer.
- **Patterns.** CSS utilities in `globals.css`, all decorative:
  - `.bg-grid` is a 4rem blueprint grid behind sky heroes and page headers. `.bg-grid-night` is the 2rem version for night panels.
  - `.bg-dots` is a CSS halftone in `currentColor`.
  - `.bg-hatch` is vertical hatching in `currentColor`, used for empty states and archived chart segments.
  - `cn()` registers these as one tailwind-merge group, so they combine with `bg-*` colours instead of replacing them.
- **Z-index.** Only through variables: `z-(--z-nav)` 40, `--z-overlay` 50, `--z-toast` 60.

## Dither and ASCII

- **`DitherImage`** (`src/components/motion/dither-image.tsx`) redraws a photo through an 8×8 Bayer threshold map onto a canvas in two colours (by default `sky-deep` ink on sky). `reveal` controls how the real photo shows through: `hover` wipes the dither away on hover (touch screens keep a top fade instead), `fade-top` keeps the photo at the bottom, and `always` keeps the dither. The `<Image>` underneath is always rendered, so alt text, sizing and no-JS all work. Use it on place tiles and auth panels, never on a listing's own photos.
- **`AsciiPlan`** draws a two-bedroom plan in box characters on night, with rooms in on-night, dimensions in orange and the pool in sky. The `<pre>` is `aria-hidden` and the caption carries the meaning.
- **`Stamp`** is a rotating circular text badge on the hero. It stops under reduced motion.

## Motion

Tokens live in `src/lib/motion.ts`, mirrored as CSS ease utilities in `globals.css`. `check-tokens.ts` fails if the two drift.

| Ease | Curve | Use |
| --- | --- | --- |
| `settle` | cubic-bezier(0.32, 0.72, 0, 1) | UI state, hovers, colour |
| `reveal` | cubic-bezier(0.16, 1, 0.3, 1) | Entrances, mask reveals |
| `exit` | cubic-bezier(0.55, 0, 0.75, 0.15) | Leaving the screen |

- **Durations** in seconds: instant 0.16, fast 0.28, base 0.5, slow 0.9, reveal 1.1, cinematic 1.6.
- **Staggers**: letters 0.022, words 0.06, items 0.08, sections 0.14.
- **Springs**: `ui`, `press` and `panel` use `visualDuration` with zero or near-zero bounce. `magnetic` is reserved for the hero CTA.
- **Budget.** Motion confirms an action or reveals content once. The only loops are the ticker marquee, the stamp rotation and the live-dot ping, and all three stop under reduced motion.

### Ownership

Three libraries, three jobs. Each library owns one kind of motion, so two libraries never fight over the same element.

| Library | Owns | Primitives |
| --- | --- | --- |
| Framer Motion | Component state and gesture: hover, press, presence, layout and shared elements, menu, dialogs, sheets, toasts, form errors, in-view reveals | Button, Reveal, Dialog, Sheet, Toast, SegmentedControl, PropertyCard, SiteNav, Lightbox |
| GSAP + ScrollTrigger | Scroll-linked reveals: gallery rows on the property page, clip-path image reveals | ScrollImage, GalleryColumn |
| Anime.js v4 | SVG and type sequencing: stroke draws, split-word headlines, numeric count-ups | Wordmark, SplitHeading, CountUp |

ESLint enforces the split in `eslint.config.mjs`:

- `gsap`, `@gsap/react` and `gsap/*` may only be imported in `src/lib/gsap.ts`. Everything else imports `gsap`, `ScrollTrigger`, `useGSAP` and `MEDIA` from `@/lib/gsap`, which registers the plugins and the custom eases exactly once.
- `animejs` may only be imported under `src/components/motion/`.
- String literals containing `cubic-bezier(`, `ease-in`, `ease-out`, `ease-in-out`, `ease-linear` or `easeInOut` are banned outside `src/lib/motion.ts`. Use the tokens.

Further rules:

- Animate only `transform`, `opacity` and `clip-path`. The one exception is `Reveal`'s six pixels of blur on entry, which is short and once per element.
- CSS transitions are for colour, background, ring and shadow only. Anything that moves goes through Framer.
- **Reduced motion.**
  - `MotionConfig reducedMotion="user"` covers Framer.
  - GSAP code runs inside `gsap.matchMedia()` under `MEDIA.motionOk`.
  - Anime primitives check `prefersReducedMotion()` and jump to the end state.
  - A global CSS block kills keyframe animations and transitions.
- **No flash before hydration.** An inline script adds `.js` to `<html>`. Pre-animation states, such as hidden split words and undrawn wordmark strokes, apply only under `.js` and `prefers-reduced-motion: no-preference`. Without JavaScript the content is simply there.

## Component language

- **Buttons** are `rounded-md` with a square icon well. On hover the well drifts up-right and its arrow swaps for a twin arriving from below-left. Pressing compresses the shell to 97.5%. Variants:
  - `primary` is ink with an orange well;
  - `accent` is orange with an ink well, for the single most important action on a screen;
  - `secondary` is white with a ring;
  - `ghost` is an ink outline;
  - `on-image` is white over photos.

  Icons are passed by name (`icon="arrow-right"`) so Server Components can render buttons.
- **Eyebrows** are mono micro labels on a small 4px chip, with an optional square dot. Tones are `paper`, `night` and `image`.
- **Fields** are 8px-radius white wells. `Field` wires label, hint and error to its control by context. Errors fade in beneath with an icon and `aria-live`.
- **Search and filters** sit in a sticky night bar: a keyword input with an orange magnifier, mono-labelled selects and an orange Buy/Lease segmented control. Active filters show as sky chips with a remove button.
- **Status pills** come from a lookup table keyed by domain status. Listings: draft, in review, published, sold, archived. Inquiries: new, contacted, closed.
- **Property cards** are white with a photo on top. On hover or focus the photo scales slightly, the ring turns ink, a hard ink offset shadow appears and the arrow tile turns orange. Below sit the type, the title, the location, the price and the facts. The feature variant adds a mono spec sheet (offer, province, lot, price per m², listed).
- **Property page** opens on a sky header with a breadcrumb, the title, location and price, then a photo mosaic. Chapters below are numbered with ink chips. Key facts are a ruled grid of condensed figures, and the location block pairs the address with a night "map" card.
- **Dashboards** sit in a sunken frame with a sidebar (wordmark, role chip, one quick action, icon nav, account card) and a paper sheet with a mono path breadcrumb. Shared widgets live in `src/components/dashboard/widgets.tsx`: `StatCard` (paper, accent, night and sky tones with condensed count-ups), `Card`, `StackedBar`, `BarChart`, `MeterRow`, `DataTable` and `EmptyNote`. Charts are categorical bars drawn in HTML with `role="img"` and a text label.
- **Navigation** is fixed. It is transparent over any region marked `data-nav-surface="image"` and settles into a blurred paper bar after scrolling. On mobile, a full-height curtain lists the links and office phone numbers.
- **Footer** is a bay-blue sheet with rounded top corners that tucks over the end of the page. The top row has the wordmark, a one-line statement with an orange word chip, and two calls to action. Below sit four columns (Browse, Members, Company, Offices), then the brokerage licence and the photography credit with a mono coordinates line. It ends on a dithered sea horizon in sky on bay. Inside the footer the focus ring is sun, because orange fails on blue.

## Imagery

- **Subjects.** Tropical modern residences, timber, stone, water and deep eaves. Look for daylight and dusk, warm interiors and lived-in calm. Avoid North American suburbs, McMansions, generic apartment blocks and empty white-box stock.
- **Treatment.** Never filter or tint a listing's own photographs. Dither belongs to place tiles and decorative panels only.
- **Sizes.** Always pass `sizes`. Pass `preload` only for the single above-the-fold image. Next 16 deprecates `priority` in favour of `preload`.
- **Missing images** fall back to a sunken well with the monogram, never a broken icon.
- **Alt text** describes the place, for example "A dark timber house glowing at dusk beneath an old acacia tree". Never "image of property".

## Accessibility

- **Skip link** to `#main` is first in tab order. Every layout must render `<main id="main" tabIndex={-1}>`.
- **Focus ring.** A 2px `accent-ink` outline, offset 3px, with a paper gap drawn as a box-shadow. It clears 3:1 on paper (5.05). On night surfaces the bright `accent` is used (6.05).
- **Mobile menu** is `role="dialog"`. The rest of the page goes `inert`. The first link takes focus, and Esc closes the menu and returns focus to the toggle.
- **Dialogs** use the native `<dialog>` with `showModal()`, which gives an inert background, Esc handling, a scroll lock and focus restore.
- **Split headings** expose the full sentence through `aria-label`. The animated word spans are `aria-hidden`.
- **Count-ups** render the final value on the server, with a visually hidden copy for assistive tech.
- **Charts** are `role="img"` with an `aria-label` that states the numbers, and every chart has a text legend.
- **Prices** carry a visually hidden full form, so "₱120M" is announced in full.
- **Target size.** The nav toggle and `md`/`lg` buttons are 44px or taller. `sm` buttons are 40px and suit dense desktop UI, not primary touch actions.

## Do and don't

| Do | Don't |
| --- | --- |
| Use orange for the one thing to press or notice | Put orange on borders, large text or decoration |
| Put ink labels on orange fills | Put white text on orange |
| Show prices, areas and counts plainly, in mono or condensed figures | Hide data behind hover or vague copy |
| Use one highlighted word per headline | Highlight whole headlines or use italics |
| Use Phosphor icons at `regular` or `bold` | Mix icon sets or use `thin` at small sizes |
| Keep dither and ASCII decorative and labelled | Dither a listing's own photographs |
| Use `motion.ts` eases and durations | Write `linear`, `ease-in-out` or a raw cubic-bezier |
| Keep motion short and once per element | Loop animations beyond the ticker, stamp and live dot |
| Use Bricolage, Hanken and JetBrains Mono | Use hairline Didones or Inter, Roboto, Arial |

## Verification levers

- `npx tsx scripts/design/check-tokens.ts` checks contrast pairs and ease parity.
- `npx tsx scripts/design/format.check.ts` checks the price, area and date formatters.
- `npx tsx scripts/design/shoot.ts` captures Playwright screenshots of `/` and `/styleguide` at 1440×900 and 390×844, plus per-section, focus, menu and dialog shots, into `/tmp/shots/design/`. It fails on console errors. Set `BASE_URL` and `SHOTS_DIR` to override.
