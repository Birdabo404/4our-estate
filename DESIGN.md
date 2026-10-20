# 4OUR Estate design system

The living reference is `/styleguide`. It renders the real components with fixture data, so if this document and the page disagree, the page is right and this document is stale.

## Philosophy

Archetype: **Editorial Luxury**. The photograph is the hero. Paper and ink set the stage, and one brass accent marks the few things that deserve a second look. The site should read like a printed property portfolio from a private brokerage, not a listings portal.

Four rules decide most arguments:

1. **Photography is unboxed.** Images are cinematic, full-bleed or column-bleed, with a 3px radius at most. No card chrome around a photo.
2. **UI is held, not floated.** Panels, forms and dialogs use the double bezel: an outer tinted shell with a hairline ring and an inner core with its own radius.
3. **Few accents, used on purpose.** Brass is for emphasis, focus and one italic word per headline, never for decoration.
4. **Motion settles, never bounces.** Everything decelerates into place on custom curves. Nothing uses `linear`, `ease-in-out` or a springy overshoot.

## Palette

Warm paper, espresso ink, and Narra brass, named after the Philippine hardwood used in heritage interiors. The tokens live in `src/app/globals.css` under `@theme`. `--color-*: initial` clears Tailwind's default palette, so only these colours exist.

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | #f4efe7 | Canvas |
| `paper-raised` | #faf7f2 | Panels, fields, card pills |
| `paper-sunken` | #e9e2d6 | Wells, skeletons, placeholders |
| `ink` | #1c1915 | Headings, body, primary buttons |
| `ink-soft` | #48413a | Secondary copy |
| `ink-muted` | #6b6257 | Meta, captions, eyebrows |
| `night` | #14120f | Footer, scrims, toasts |
| `night-raised` | #201d19 | Panels on night |
| `on-night` | #efe9df | Text on night |
| `on-night-muted` | #a69d90 | Meta on night |
| `accent` | #82613b | Narra brass. Focus, emphasis |
| `accent-soft` | #c8ae86 | Accent on night |
| `positive` | #4f6249 | Published, contacted |
| `danger` | #9e3f2a | Errors |

### Contrast

Computed by `npx tsx scripts/design/check-tokens.ts`, which parses `globals.css` and applies the WCAG 2.x relative-luminance formula. The script exits non-zero if any pair drops below its threshold. The styleguide palette section computes the same numbers live from the same file.

| Foreground | Background | Ratio | Needs | Role |
| --- | --- | --- | --- | --- |
| `ink` #1c1915 | `paper` #f4efe7 | 15.30:1 | 4.5:1 pass | Body and headings |
| `ink-soft` #48413a | `paper` #f4efe7 | 8.77:1 | 4.5:1 pass | Secondary copy |
| `ink-muted` #6b6257 | `paper` #f4efe7 | 5.23:1 | 4.5:1 pass | Meta, captions, eyebrows |
| `ink-muted` #6b6257 | `paper-raised` #faf7f2 | 5.60:1 | 4.5:1 pass | Meta inside panels |
| `ink-muted` #6b6257 | `paper-sunken` #e9e2d6 | 4.65:1 | 4.5:1 pass | Meta on sunken wells |
| `accent` #82613b | `paper` #f4efe7 | 4.93:1 | 4.5:1 pass | Accent text, links |
| `accent` #82613b | `paper-raised` #faf7f2 | 5.28:1 | 4.5:1 pass | Accent text in panels |
| `accent` #82613b | `paper` #f4efe7 | 4.93:1 | 3:1 pass | Focus ring on paper |
| `paper` #f4efe7 | `ink` #1c1915 | 15.30:1 | 4.5:1 pass | Primary button label |
| `on-night` #efe9df | `night` #14120f | 15.48:1 | 4.5:1 pass | Footer and overlays |
| `on-night-muted` #a69d90 | `night` #14120f | 6.99:1 | 4.5:1 pass | Footer meta |
| `accent-soft` #c8ae86 | `night` #14120f | 8.77:1 | 4.5:1 pass | Accent on night |
| `accent` #82613b | `night` #14120f | 3.31:1 | 3:1 pass | Focus ring on night |
| `positive` #4f6249 | `paper` #f4efe7 | 5.78:1 | 4.5:1 pass | Positive status |
| `danger` #9e3f2a | `paper` #f4efe7 | 5.74:1 | 4.5:1 pass | Field errors |
| `danger` #9e3f2a | `paper-raised` #faf7f2 | 6.14:1 | 4.5:1 pass | Field errors in panels |

Text over photography is never left to chance. Hero sections carry a vertical scrim, plus a corner scrim behind any copy that sits low and right.

## Typography

**Bodoni Moda** for display and **Jost** for everything you read. Both load through `next/font/google` in `src/app/layout.tsx`, exposed as `--font-bodoni` and `--font-jost` and mapped to `font-display` and `font-sans`.

Why this pair: a Didone over a geometric sans is the fashion-masthead pairing. Bodoni brings the high-contrast presence a luxury brokerage needs at headline size. Jost is a Futura revival, calm and geometric, and stays legible at 14px. Before choosing, I prototyped three display faces (Bodoni Moda, Gloock, Newsreader) against three sans faces (Jost, Hanken Grotesk, Albert Sans) at hero and card sizes. Gloock read too heavy and corporate. Newsreader was the runner-up but felt literary rather than luxurious.

Bodoni needs care in two places.

- **Optical size.** Bodoni Moda has an `opsz` axis that thins hairlines as size grows. Left on `auto`, a 140px headline runs at opsz 96 and commas and crossbars vanish. Display text pins the axis with `font-variation-settings: "opsz" var(--opsz, 30)`. Smaller tokens lower it: `text-display-3` uses 22, `text-heading` 16 and `text-title` 11. At 30, the hyphen in "Two-bedroom" disappeared at title size; at 11 it holds. Override per element with `[--opsz:N]`.
- **Peso sign.** ₱ is in the `latin-ext` subset, which is loaded.

| Token | Size | Leading | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-display-1` | clamp(3.25rem → 8.75rem) | 0.92 | -0.035em | Hero, once per page |
| `text-display-2` | clamp(2.75rem → 5.5rem) | 0.98 | -0.03em | Listing titles on detail |
| `text-display-3` | clamp(2.125rem → 3.625rem) | 1.04 | -0.025em | Section headings |
| `text-heading` | clamp(1.5rem → 2.125rem) | 1.12 | -0.015em | Panels, dialogs, feature cards |
| `text-title` | 1.3125rem | 1.25 | -0.01em | Card titles |
| `text-lead` | clamp(1.125rem → 1.3125rem) | 1.6 | 0 | Intros |
| `text-body` | 1rem | 1.7 | 0 | Running text |
| `text-small` | 0.875rem | 1.6 | 0 | Facts, labels, buttons |
| `text-micro` | 0.6875rem | 1.4 | 0.24em | Eyebrows, uppercase only |

Rules:

- Display weight is 400. Use 500 only when text sits on a busy photo.
- One italic word per headline at most. `SplitHeading` marks it with `*word*`.
- Uppercase belongs only to `text-micro`, always with its tracking.
- Prices and figures use `.tabular` so columns align.
- `h1` to `h4` default to the display face with `text-wrap: balance`, and paragraphs use `pretty`.

## Space, grid and form

- **Spacing.** Tailwind's 4px scale. Sections breathe: `Section` defaults to `py-24 md:py-36 lg:py-44`, with `hero`, `tight` and `flush` options.
- **Grid.** 12 columns from `md`. Editorial splits are asymmetric, for example an image at 6 columns and copy at 5 columns starting on column 8. Copy columns cap at about 42ch.
- **Container.** `wide` is 96rem for photography, `default` 80rem, and `prose` 44rem. Gutters are `px-5 sm:px-8 lg:px-12`.
- **Radii.**
  - `rounded-photo` is 3px for photographs.
  - `rounded-field` is 14px for inputs.
  - `rounded-panel` is 32px for the bezel shell. The core radius is `calc(var(--radius-panel) - 0.375rem)`, so the curves stay concentric.
  - Buttons and pills use `rounded-full`.
- **Elevation.** Three warm-tinted shadows: `shadow-hairline`, `shadow-lift` and `shadow-float`. They are layered and diffuse, and never a single dark drop.
- **Grain.** A fixed SVG `feTurbulence` layer at 5% opacity with `multiply` blend (`.grain` in the root layout). It sits above content with `pointer-events: none` and gives the paper tooth.
- **Z-index.** Only through variables: `z-(--z-nav)` 40, `--z-overlay` 50, `--z-toast` 60, `--z-grain` 70.

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

### Ownership

Three libraries, three jobs. Each library owns one kind of motion, so two libraries never fight over the same element.

| Library | Owns | Primitives |
| --- | --- | --- |
| Framer Motion | Component state and gesture: hover, press, presence, layout and shared elements, menu, dialogs, sheets, toasts, form errors, in-view reveals | Button, Reveal, Dialog, Sheet, Toast, SegmentedControl, PropertyCard, SiteNav |
| GSAP + ScrollTrigger | Scroll-linked choreography: hero scale and parallax, clip-path image reveals, pinned or horizontal sequences | ScrollImage |
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

- **Buttons** are pills with a nested icon well. On hover the well drifts up-right and its arrow swaps for a twin arriving from below-left. Pressing compresses the shell to 97.5%. Variants are `primary` (ink), `secondary` (raised paper), `ghost` (hairline) and `on-image` (paper over photos). Icons are passed by name (`icon="arrow-right"`) so Server Components can render buttons.
- **Eyebrows** are micro uppercase in a hairline pill, with an optional brass dot. Tones are `paper`, `night` and `image`.
- **Fields** are 14px-radius wells on raised paper. `Field` wires label, hint and error to its control by context. Errors fade in beneath with an icon and `aria-live`.
- **Status pills** come from a lookup table keyed by domain status. Listings: draft, in review, published, sold, archived. Inquiries: new, contacted, closed.
- **Panels** use the double bezel. Use them for forms, dialogs, dashboards and compact lists, never around a hero photograph.
- **Property cards** are unboxed. The photo has a 3px radius and slowly scales to 1.045 on hover or focus, and a "View residence" bar lifts in. Below sit the type and listing eyebrow, the Bodoni title, the location, a hairline, the price and the facts.
- **Navigation** is fixed and quiet. It is transparent and white over any region marked `data-nav-surface="image"`. After 24px of scroll it settles into a detached, blurred paper pill. On mobile, a full-height paper curtain uses numbered serif links and lists office phone numbers.
- **Footer** is night. It carries a statement line, explore links, offices, and a hairline wordmark at full width.

## Imagery

- **Subjects.** Tropical modern residences, timber, stone, water, and deep eaves. Look for dusk light, warm interiors and lived-in calm. Avoid North American suburbs, McMansions, generic apartment blocks and empty white-box stock.
- **Treatment.** Never filter or tint photographs. Use scrims for legibility. Hero images get `intensity="hero"`, a slow scale with scrubbed drift. In-flow images get the default clip-path reveal.
- **Sizes.** Always pass `sizes`. Pass `preload` only for the single above-the-fold image. Next 16 deprecates `priority` in favour of `preload`.
- **Missing images** fall back to a sunken well with the monogram, never a broken icon.
- **Alt text** describes the place, for example "A dark timber house glowing at dusk beneath an old acacia tree". Never "image of property".

## Accessibility

- **Skip link** to `#main` is first in tab order. Every layout must render `<main id="main" tabIndex={-1}>`.
- **Focus ring.** A 2px brass outline, offset 3px, with a paper gap drawn as a box-shadow. Buttons keep their own ring shadow, so on them the outline stands alone. Brass clears 3:1 on paper (4.93) and night (3.31). Components that use `transition-colors` fade the ring's colour in from `currentColor` over 500ms; the outline itself appears at once. I tab-audited every nav, hero and footer stop at 1440 and 390 widths.
- **Mobile menu** is `role="dialog"`. The rest of the page goes `inert`. The first link takes focus, and Esc closes the menu and returns focus to the toggle.
- **Dialogs** use the native `<dialog>` with `showModal()`, which gives an inert background, Esc handling, a scroll lock and focus restore.
- **Split headings** expose the full sentence through `aria-label`. The animated word spans are `aria-hidden`.
- **Count-ups** render the final value on the server, with a visually hidden copy for assistive tech.
- **Prices** carry a visually hidden full form, so "₱120M" is announced in full.
- **Target size.** The nav toggle and `md`/`lg` buttons are 44px or taller. `sm` buttons are 40px and suit dense desktop UI, not primary touch actions.

## Do and don't

| Do | Don't |
| --- | --- |
| Let one photograph carry a section | Box photos in rounded cards with shadows |
| Use one italic word per headline | Italicise whole headlines or use bold display |
| Put brass on focus and the single emphasis | Use brass for borders, backgrounds or decoration |
| Use Phosphor icons at `light` or `thin` weight | Use bold or filled icons, or mix icon sets |
| Use `motion.ts` eases and durations | Write `linear`, `ease-in-out` or a raw cubic-bezier |
| Settle into place | Bounce, wobble or overshoot |
| Use a double-bezel panel for forms and dialogs | Use a double bezel around photography |
| Use warm layered shadows from the tokens | Use `shadow-lg`, black drops or glows |
| Use Bodoni and Jost | Use Inter, Roboto, Arial, Open Sans or Helvetica |
| Keep uppercase micro text tracked at 0.24em | Use uppercase at body size |

## Verification levers

- `npx tsx scripts/design/check-tokens.ts` checks contrast pairs and ease parity.
- `npx tsx scripts/design/format.check.ts` checks the price, area and date formatters.
- `npx tsx scripts/design/shoot.ts` captures Playwright screenshots of `/` and `/styleguide` at 1440×900 and 390×844, plus per-section, focus, menu and dialog shots, into `/tmp/shots/design/`. It fails on console errors. Set `BASE_URL` and `SHOTS_DIR` to override.
