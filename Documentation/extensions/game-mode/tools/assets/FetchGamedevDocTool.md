# FetchGamedevDocTool

`extensions/game-mode/tools/assets/FetchGamedevDocTool.js`

`fetch_gamedev_doc`: fetches a tutorial page headlessly ([PageReader](../../../../core/llm-server/chat/web-tools/PageReader.md), 20 s; the page text, at most 60,000 chars) and ingests it into the `gamedev` knowledge base.

## Methods

- `new FetchGamedevDocTool(scope, { kbCacheDir })`.
