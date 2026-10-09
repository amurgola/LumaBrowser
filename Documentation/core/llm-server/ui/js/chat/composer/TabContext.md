# TabContext

`core/llm-server/ui/js/chat/composer/TabContext.js`

Ask about an open browser tab. The composer's globe button opens a picker of
the user's web tabs (`api.pageContext.listTabs`, the last viewed one first and
badged "Last viewed"); the tab they were just on (viewed in the last 30
minutes) is also offered as a dashed suggestion chip in the
[AttachmentStrip](AttachmentStrip.md), refreshed whenever the chat window
regains focus or visibility. Picking either reads the page
(`api.pageContext.readTab`) and stages it as a text attachment: name is the
title (brackets dropped, the middle dot replaced, the host when untitled),
`source` is the host, the body starts with `URL: ...`, lines opening a code
fence are nudged by a space so the page cannot close the attachment's fence,
and a capped page says so at the end. A failed read stages a red chip with the
reason. A tab used or dismissed is not suggested again this session. Hidden
entirely where the API has no `pageContext` (the web client).

Only inline `data:image/` favicons are shown; remote icon URLs fall back to the
globe, so the chat page never fetches them.

## Methods

- `available()`, `wireButton(btn)`, `list()`.
- `toggle(btn)`, `open(btn)`, `close()`, `attach(tab, row?)`.
- `refreshSuggestion()`, `acceptSuggestion()`, `dismissSuggestion()`.
- `TabContext.suggestionHtml(tab)`, `TabContext.iconHtml(favicon)`,
  `TabContext.pageAttachment(readResult, tab)`, `TabContext.host(url)`.

## Globals

None.
