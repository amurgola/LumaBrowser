# ChatIcons

`core/llm-server/ui/js/chat/ChatIcons.js`

The chat's inline SVG icons (stroke `currentColor`, 1.75 wide) as static
strings, plus the LumaBrowser app mark (`logo`: ring and "L" in the current text
color, the brand's orange corner, class `cm-mark-light` so the landing can animate it) and `pulse()`, the pulsing logo painted into a
reply before its first token.

## Methods

- Static strings: `plus`, `search`, `panel`, `sliders`, `chevron`, `dots`,
  `copy`, `retry`, `readAloud`, `readStop`, `alert` (a failed step), `check`, `send`, `stop`, `edit`,
  `trash`, `pin`, `tools`, `doc`, `brush` (mark an area to edit), `image`, `expand`, `paperclip`, `gear`, `x`,
  `clock`, `play`, `pause`, `download`, `link`, `share`, `grid`, `book` (the
  documentation source pill), `mic`, `logo`.
- `ChatIcons.pulse()`.
