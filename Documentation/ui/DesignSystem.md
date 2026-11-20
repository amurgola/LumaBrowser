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
- **Settings pages:** a tab is one subject a person would name ("Privacy & permissions", "Editors & agents"), short enough to read in one or two screens; the sidebar groups tabs under quiet labels and keeps "Jump to a setting" at the top. Rows people change often stay in view. A set-once group (installers, allow-lists, long lists of paired things) is a fold group (ui/shell/settings/general/FoldGroups.md): one line with its title and a few words on its state, opened by the user or by something that needs attention. Buttons are state-driven: offer Install, Update or Connect only when there is something to do, and keep the rare action (Remove, Reinstall) quiet. A list of configured things (providers) is compact rows that open in place, with the ones that still need setting up open; adding one is the list's last row (`.gs-add-row`, dashed), which opens its form in place, and a choice between kinds of thing is a row of radio cards (`.gs-choice`). Sidebar groups are parted by a hairline, and the group label is smaller and heavier than a tab.
- **Extension lists:** every Settings > Extensions pane draws extensions with `ExtCard` (core/shell/ui/settings/ExtCard.md): one bordered card per extension, a single folded line (active checkbox, icon or initial, name and version, one-line summary, a state word, one primary action, chevron) and a sunken tray for the rest. Checked means active, as in the tools lists. Offer Update only when a newer version is known; otherwise Reinstall lives in the tray.
- **Badges:** only when they carry state the user acts on. Neutral by default (`--bg-surface-2` fill, `--text-secondary`, 11px, `--radius-sm`); status color only for warnings and errors. Counts are plain text, not pills.
- **Navigation:**
  - The selected item gets an `--bg-surface-2` fill and primary text.
  - No colored stripe on the left edge.
  - Segmented controls use a neutral track, and the selected segment uses `--bg-elevated`, not an accent gradient.
- **Icons:** one stroked set (Lucide style), 1.75px stroke, 16px in chrome and 14px inline. No emoji or Unicode glyphs as icons. Icons sit inline; no colored icon tiles.
- **Empty states:** one quiet sentence, saying what to do next. No illustrations, greetings or suggestion pills.
- **Copy:** plain and specific, e.g. "Clear history", "Update", "Model not found". No "Easy", "Supercharge", "Unlock", and no exclamation marks.

## Notices

A message to the user takes one of four forms. Choose by where the message belongs, not by how loud it should be.

| Form | Use it for | Built with |
|---|---|---|
| On the thing itself | the result of an action on one row, card or field | a state word (`Installed`, `Install failed`) with the reason under it: `ExtCard.setOutcome`, `.gs-row-error`, `.luma-form-err` |
| Inline notice | a condition of the page or section in view | `.luma-callout`; [Notice](../core/llm-server/ui/js/notice/Notice.md) when it has a title, an action or a close button |
| Toast | the result of something the user just did that has no row to sit on | `.luma-toast` ([SettingsFeedback](shell/settings/SettingsFeedback.md) in Settings) |
| Dialog | a decision that has to be made before going on | `LumaModal` through `Dialogs`, always awaited |

- **Next to its cause first.** A result that has a place is shown in that place. A toast is the fallback for results with no location; it is not where an error with a location goes.
- **A success that shows itself gets no message.** When the button now reads `Installed`, nothing else announces it.
- **State is a tint and words.**
  - Warning is `--warning-dim`, failure is `--danger-dim`, everything else is the neutral `--bg-surface-2`.
  - A title, when there is one, takes the status color; the text says what happened, so the notice still reads with the color removed.
  - No status dot, no icon in a tinted circle, no left stripe, and no typed character standing in for an icon (`x`, `!`, a check mark).
- **Say what happened and what to do next**, in one or two short sentences. No "successfully", no blame, no error code as the title.
- **At most one action**, a quiet secondary button named for what it does in two or three words.
  - When the fix lives on another page, the action goes there through the search palette's reveal: `SettingJump.action(id, label)` in the shell, `api.palette.reveal(id)` in the LLM tab, with an id from the settings catalogs (`core/palette/catalog`). The page opens, the folded group unfolds and the row is highlighted.
  - Do not describe the route in prose ("Settings > API & MCP").
- **Failures stay.** A warning, a failure, or anything that needs an action does not leave on a timer. A plain success toast leaves after 3.5 s, one with an action after 8 s.
- **Dismiss is an icon button**: the stroked close icon with the accessible name "Dismiss" (`Notice.closeButton`).
- **Roles:** a failure is `role="alert"`; every other notice is `role="status"`.
- **A toast is a level 2 surface**: `--surface-pop` and `--shadow-pop`, no border (the shadow draws the edge). A failure mixes the tint onto the surface so it stays opaque over content.

Where this differs from the large public systems: Primer, Carbon, Fluent and Atlassian pair each severity with an icon. Here the pairing is the tint with a plain statement, as the chat's failed-turn card does it. The rules they agree on are kept: feedback next to its cause, no timed errors, color never alone, one action, an alert role for failures.

## Status dots

- A dot (`.luma-dot`) marks the state of one row in a list (a source, a monitor, a share), beside a word or, on a dense row, with a title. It is never the marker of a notice, a toast or a heading.
- **Colors:** grey for idle, off or unknown; `--success`, `--warning`, `--danger` for outcomes. The warm hues are hard to tell apart at 8px, which is why the word is required.
- **Working is neutral.** A running state is `--text-primary` with the slow pulse (`.luma-dot.busy`), or the spinner. Accent means selected or primary and warning means something needs attention, so neither is the color of "running".
- Accent on a dot only where it marks the current item of a sequence (the step you are on).
- No glow, halo or ring around a dot.
- New code uses `.luma-dot` and does not define another dot class.

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
10. A dot, icon tile or stripe marking a notice
11. Typed characters used as icons
12. A failure that times out, or a route written in prose instead of a button
