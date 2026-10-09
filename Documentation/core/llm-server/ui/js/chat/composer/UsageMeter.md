# UsageMeter

`core/llm-server/ui/js/chat/composer/UsageMeter.js`

The composer's context meter: how full the window is (a bar coloured warm at 75%
and hot at 90%, the percent, used/window) or raw prompt/completion counts when
the window is unknown, with the breakdown in the tooltip.

## Methods

- `render()`: the window falls back to the active model's chosen context.
- `UsageMeter.view(usage, window)`: `{ html, title }`.
- `UsageMeter.num(n)`: locale-grouped number.
