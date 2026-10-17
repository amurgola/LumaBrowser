# DesktopCallText

`core/llm-server/chat/approval/DesktopCallText.js`

Approval-card sentences for the `desktop_*` tools: what will be opened,
clicked, typed or pressed, and where.

## Methods (all static)

- `launch(p)` `Open <app> with <args> on your desktop`.
- `click(p)` `Click` or `Double-click`, then `"<description>"`, `element <ref>`
  or `the point <x>, <y>`, then where.
- `type(p)` `Type "<text>"`, plus ` and press Enter` with `submit`, then where.
- `pressKey(p)` `Press <keys>` then where.
- `scroll(p)` `Scroll <direction>` (default `down`), ` over "<description>"`
  when given, then where.
- `DESCRIBERS` (frozen) the per-tool table for `desktop_launch`, `desktop_click`,
  `desktop_type`, `desktop_press_key`, `desktop_scroll` and `desktop_focus`
  (`Bring a window to the front (...)`), spread into
  [CallDescriber](CallDescriber.md)'s table.

Where: `on the desktop` for hwnd 0, `in "<window>"` for a title, `in window <hwnd>`,
else `in a desktop window`. Values are clipped with [CardText](CardText.md).

## Why

Without these the card said `Run desktop_click`, which tells the user nothing
about which window gets the input.
