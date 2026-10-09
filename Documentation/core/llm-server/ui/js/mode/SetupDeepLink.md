# SetupDeepLink

`core/llm-server/ui/js/mode/SetupDeepLink.js`

Reads Setup deep links from the tab URL hash.

## Methods

- `pageFromHash(hash)`: `#setup` is `settings`, `#setup/<view>` is the
  decoded view (built-in page or extension tab id, `ext:` prefix allowed), else `null`.
- `isChat(hash)`: `#chat`.
