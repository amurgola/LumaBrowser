# ActionTarget

`core/llm-server/chat/tool-loop/ActionTarget.js`

Names what a browser action is aimed at.

## Methods

- `ActionTarget.of(name, params)`:
  - `click_at`: `point:<cx>,<cy>`, in `POINT_CELL_PX` (24) cells;
  - `scroll`: `selector:<s>`, else `direction:<d>` (default down);
  - `locate`: `described:<folded description>`;
  - `press_key`: `key:<k>@<element>`;
  - `click`: the element, plus `#<text>` when a text filter is given;
  - anything else: `ref:<n>`, `selector:<s>` or `page`.

## Why

[InertActionCheck](InertActionCheck.md) counts repeated futile attempts at the
same thing. The tab, typed text and button don't change what is aimed at. 24 px
is WCAG 2.2's minimum pointer target, so two points in one cell aim at one
control.
