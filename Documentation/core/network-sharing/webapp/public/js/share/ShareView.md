# ShareView

`core/network-sharing/webapp/public/js/share/ShareView.js`

The read-only viewer of a shared conversation link (`/share/<token>`, served by
[ShareRouter](../../../ShareRouter.md)). It fetches the sanitized thread from
`./data` and paints it with the chat's own classes and markdown engine; no
composer and no `/sharing` API. In export mode (the LLM tab's PDF/PNG download,
[ConversationExportHtml](../../../../../llm-server/chat/ConversationExportHtml.md))
it renders `window.__LUMA_EXPORT__` and fetches nothing.

## Methods

- `new ShareView({ win = window, doc = document })`: the share base is
  `location.pathname` without trailing slashes.
- `ShareView.exportData(win)`: `__LUMA_EXPORT__` when it is an object, else `null`.
- `start()`: export mode renders the inlined projection (failure:
  `This conversation could not be rendered.`); otherwise
  `fetch(<base>/data, { cache: 'no-store' })` and render (any failure:
  `This share link is no longer available.`).
- `render(data)`: throws unless `data.success`. Title (`<title> - LumaBrowser`,
  `#svTitle`) and local date (`#svMeta`); in export mode the badge reads
  `exported <date>` and the footer `Exported from LumaBrowser`. Renders user and
  assistant turns through [ShareTurnView](ShareTurnView.md); no messages shows
  `This conversation has no messages.`
- `fail(message)`: one escaped `.sv-status` line.

## Globals

Reads `window.__LUMA_EXPORT__`, `window.location`, `window.fetch` (through `win`).
