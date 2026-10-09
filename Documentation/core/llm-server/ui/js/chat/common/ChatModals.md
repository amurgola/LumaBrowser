# ChatModals

`core/llm-server/ui/js/chat/common/ChatModals.js`

The chat's themed (cm-modal) confirm and rename dialogs, used instead of
Electron's unstyled native confirm and its missing prompt. Escape and the
backdrop cancel, Enter accepts, the OK button (or the input) takes focus.

## Methods

- `ChatModals.confirm(host, message, { danger, confirmLabel, cancelLabel }?)`
  resolves a boolean.
- `ChatModals.prompt(host, title, initial)` resolves the trimmed text, or `null`
  on cancel or an empty value.
