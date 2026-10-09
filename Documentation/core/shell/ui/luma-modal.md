# luma-modal.js (LumaModal, classic)

`core/shell/ui/luma-modal.js`

The themed replacement for `window.alert`, `confirm` and `prompt`. Native
dialogs are off-theme and freeze the renderer while open; these render inside
the document and keep the event loop running.

## Classic-script exception

This file stays one self-contained classic script (an IIFE holding one class,
`LumaModal`), because:

- it is served alone at `/llm-ui/luma-modal.js` by app/gateway/StaticUiRoutes
  (`MODAL_FILE`) and the web backend (WebAppServer), so it cannot import siblings;
- the extension editor (`core/shell/extension-editor.html`, `ui/luma-modal.js`)
  and the shell (`index.html`, `core/shell/ui/luma-modal.js`) load it with a
  plain script tag;
- extension and add-on scripts (classic) call `window.LumaModal` and the
  overridden native dialogs.

Load it with `<script src=".../luma-modal.js"></script>` before the page's
module entry. Module code calls [Dialogs](../../llm-server/ui/js/dialogs/Dialogs.md)
rather than the global.

## API (`window.LumaModal`)

- `alert(message, { title?, okLabel? }?)` resolves `undefined`. Title defaults
  to "Notice".
- `confirm(message, { title?, okLabel?, cancelLabel?, danger? }?)` resolves
  `true`/`false`. Title "Confirm", buttons Cancel then Confirm (`danger` makes
  OK the red destructive button).
- `prompt(message, defaultValue?, opts?)` resolves the text or `null`. Title
  "Input"; the input is focused and selected; Enter submits, Escape cancels.
- `_installed: true`.

Loading also replaces `window.alert/confirm/prompt` with these (so legacy
`if (confirm(...))` callers must `await`). Behaviour: the message is text
(never HTML); a click on the dim surround cancels; Escape closes only the
topmost of stacked dialogs; each dialog resolves once, fades out for 120 ms and
returns focus to the element that opened it. Styles are one injected
`<style id="lm-styles">`, scoped to `.lm-*` and built on the theme tokens with
fallbacks. Loading twice is a no-op.

## Globals

Writes `window.LumaModal`, `window.alert`, `window.confirm`, `window.prompt`;
reads `document`, `requestAnimationFrame`.
