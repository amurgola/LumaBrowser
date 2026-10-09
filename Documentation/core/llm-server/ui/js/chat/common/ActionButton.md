# ActionButton

`core/llm-server/ui/js/chat/common/ActionButton.js`

Runs a host call behind a task or trigger view button: disables it, shows the
host's error (escaped, or a fallback) on the button when the call fails,
optionally restores it after 2.5 s, and runs `onSuccess` otherwise.

## Methods

- `ActionButton.run(btn, call, { fallback, restoreHtml?, keepEnabled?, plainText?, onSuccess? })`
  resolves the result or `null`.
