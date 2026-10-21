# LumaBrowser design system

The rules every surface follows: the shell window, the LLM tab (setup and chat), the dashboard, overlays, extension panels and the web app. The goal is a calm, neutral frame where one accent color marks what is selected or what to do next, and nothing looks generated from a template.

Tokens live in one file, [core/llm-server/ui/css/tokens.css](../core/llm-server/ui/css/tokens.css). `base.css` imports it, and `index.html` links it before every shell stylesheet. Components read tokens; they never define their own `:root` palette.

## Color

The palette is unchanged from the original theme. Use it with restraint.

- **Neutral first.** About 95% of any screen is the navy surfaces and the grey text ramp.
- **Accent (`--accent`, orange) only for:**
  - the selected item (active tab, nav item, segment)
  - the single primary button in a view
  - focus rings
  - the "on" state of toggles and checkboxes
  - a progress bar
- **Accent never for:** headings, section labels, borders on idle elements, icons at rest, badges, links in chrome, scrollbars.
- **Status colors carry state** (`--success`, `--warning`, `--danger`):
  - Always pair them with a word, e.g. "Running", "Update available", "Failed".
  - The tinted `-dim` fill is for an inline notice, not for every badge.
- **No gradients on UI.** None on buttons, text, borders, backgrounds or tabs, and no radial glows. Use a flat fill.
- **No hardcoded colors.** A new hex or rgba value in a component needs a token instead. The exception is model-authored or third-party content (for example the live artifact paper).

## Surfaces and elevation

There are three levels. Each is a lightness step up from the one below.

| Level | Token | Used for |
|---|---|---|
| 0 | `--bg-root` | window chrome, tab strip, sidebars, page background |
| 1 | `--bg-surface`, `--bg-surface-2` | panels, settings content, inputs, selected rows |
| 2 | `--surface-pop` | menus, popovers, modals |

Rules:
- Peers are separated by a 1px `--border-soft` line or by spacing, not by both a border and a shadow.
- Only level 2 gets a shadow (`--shadow-pop`).
- Do not nest a boxed card inside a boxed card. Use a heading and spacing.
- No `backdrop-filter`. The only exception is a modal scrim (`--scrim`), at 4px at most.

## Type

- **Font:** the platform UI font (`--font-sans`: Segoe UI Variable on Windows, SF on macOS). No web fonts.
- **Monospace** (`--font-mono`) is for code, file paths, URLs, shortcuts and model IDs, never for labels or decoration.
- **Scale:** five sizes only.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 11px | meta, counts, shortcut hints |
| `--text-sm` | 12px | helper text, secondary lines |
| `--text-md` | 13px | body and controls |
| `--text-lg` | 15px | section and dialog titles |
| `--text-xl` | 20px | page titles |

- **Weight:** body is 400; labels, row titles and buttons are 500; titles are 600. Nothing is bolder than 600.
- **Sentence case everywhere.**
  - No `text-transform: uppercase`.
  - No wide letter-spacing.
  - No "eyebrow" label above a heading.
  - No middle-dot breadcrumbs in headings.

## Spacing, radius, motion

- **Spacing:** use `--space-*` (4, 8, 12, 16, 20, 24, 32). Related items sit 4-8 apart and groups 16-24 apart.
  - A heading sits closer to its own content than to the section above it.
- **Radius by role:**

| Token | Size | Use |
|---|---|---|
| `--radius-sm` | 4px | tags, keycaps |
| `--radius-md` | 6px | buttons, inputs, menu items |
| `--radius-lg` | 8px | tabs, rows, small cards |
| `--radius-xl` | 12px | panels, popovers, modals |

  - Pill radius is for toggles and avatars only.
- **Motion:** `--dur-fast` (120ms) for hover and press, `--dur` (180ms) for panels, both with `--ease`.
  - Animate `transform`, `opacity`, `background-color` and `color`; never `transition: all`.
  - No bounce, shimmer, pulsing glows or hover scale.
  - An animated indicator means real work is happening.
  - Respect `prefers-reduced-motion`.

## Components

- **Buttons:** primary (accent fill, `--on-accent` text, at most one per view), secondary (`--bg-surface-2` fill, `--border-soft` line), ghost (no fill until hover). Height 28px (compact) or 32px; `--radius-md`; 500 weight. Icon buttons are 28px square ghosts.
- **Settings rows:** label on the left (13px/500) with optional helper text under it (12px, `--text-secondary`), and the control right-aligned. Rows are separated by `--border-soft` hairlines inside a group. A group has a 15px/600 title above it and no box around each row. Advanced options collapse behind a plain "Advanced" disclosure.
- **Extension lists:** every Settings > Extensions pane draws extensions with `ExtCard` (core/shell/ui/settings/ExtCard.md): one bordered card per extension, a single folded line (active checkbox, icon or initial, name and version, one-line summary, a state word, one primary action, chevron) and a sunken tray for the rest. Checked means active, as in the tools lists. Offer Update only when a newer version is known; otherwise Reinstall lives in the tray.
- **Badges:** only when they carry state the user acts on. Neutral by default (`--bg-surface-2` fill, `--text-secondary`, 11px, `--radius-sm`); status color only for warnings and errors. Counts are plain text, not pills.
- **Navigation:**
  - The selected item gets an `--bg-surface-2` fill and primary text.
  - No colored stripe on the left edge.
  - Segmented controls use a neutral track, and the selected segment uses `--bg-elevated`, not an accent gradient.
- **Icons:** one stroked set (Lucide style), 1.75px stroke, 16px in chrome and 14px inline. No emoji or Unicode glyphs as icons. Icons sit inline; no colored icon tiles.
- **Empty states:** one quiet sentence, saying what to do next. No illustrations, greetings or suggestion pills.
- **Copy:** plain and specific, e.g. "Clear history", "Update", "Model not found". No "Easy", "Supercharge", "Unlock", and no exclamation marks.

## Review checklist

Before merging UI work, screenshot it and count these tells. Two or more is a fail.

1. Gradients, glows, glass blur
2. Uppercase or tracked labels
3. Accent used for decoration
4. Pills or badges with no action
5. Left-stripe accents
6. Emoji icons
7. Nested cards
8. More than five font sizes
9. Hardcoded colors
