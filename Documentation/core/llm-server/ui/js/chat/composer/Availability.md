# Availability

`core/llm-server/ui/js/chat/composer/Availability.js`

Whether anything can answer. An empty model list (no local model and no
provider) or a server error shows the composer's callout and disables Send and
the starter chips. "Off" with a configured model is normal: the local server
starts on the first message.

## Methods

- `set(ok, reason)`: re-renders only on a change.
- `render()`.
- `applyServerState(st)`: `status`/`state` `'error'` shows `st.label` (or a
  default); anything else clears it when models are listed.
