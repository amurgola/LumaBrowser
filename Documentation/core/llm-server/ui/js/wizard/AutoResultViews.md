# AutoResultViews

`core/llm-server/ui/js/wizard/AutoResultViews.js`

Automatic Setup's progress (Pause; Cancel stops BOTH the chat and the image download), done (per-leg image and music outcome) and error views (the apt line with Copy and "Check again" for missing Linux libraries, else "Try again"; "Use guided setup instead").

## Methods

- `progress`, `done`, `error` (each `(wizard, body)`); `legLine(...)`; `errorHtml(error, sysdeps)`.

## Globals

Reads `navigator.clipboard` through Clipboard.
