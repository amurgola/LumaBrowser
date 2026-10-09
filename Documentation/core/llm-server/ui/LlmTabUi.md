# LLM tab renderer

`core/llm-server/ui/` (page: `llm-tab.html`, served at `/llm-ui/llm-tab.html`)

The pinned LLM tab: the Setup surface (LLM, Image, Music, Advanced and extension
tabs), the Chat surface and the Code editor, behind the Setup / Chat / Code
slider. Start with [LlmTabPage](js/page/LlmTabPage.md); the shared library is in
[SharedUiLibrary](SharedUiLibrary.md).

## Loading

`llm-tab.html` keeps its path and its markup (the cards, ids, the mode slider,
`#setupRoot`, `#chatRoot`, `#codeRoot`); [PinnedLlmTab](../service/PinnedLlmTab.md)
loads it at `/llm-ui/llm-tab.html` once the gateway is up (a `file://` URL
before that). The `<head>` holds, in order:

1. The six stylesheets, legacy order: `css/base.css`, `css/luma-components.css`,
   `css/setup.css`, `css/chat.css`, `css/code-editor.css`, `css/live-module.css`.
2. Classic scripts `/llm-ui/luma-modal.js` (the gateway's dedicated route to
   `core/shell/ui/luma-modal.js`) and `resonant.js` (vendor ResonantJs).
3. The import map
   `{ "/llm-server/ui/": "/llm-ui/", "/llm-ui/core/llm-server/ui/": "/llm-ui/" }`.
4. One module script, `js/entry.js` ([entry](js/entry.md)).

Module scripts are deferred, so the entry runs after the document is parsed,
where legacy's 30 script tags at the end of `<body>` ran.

## Imports across mounts

Everything under `js/` imports relatively within `core/llm-server/ui/`, which the gateway serves at `/llm-ui/`, so the page's own graph needs no mapping. Bundled extension chat and Setup UIs (agent-manager, code-mode, game-mode, mcp-connector, tool-forge) are served at `/llm-ui/ext/<id>/...` and import `../../../core/llm-server/ui/js/...` by file path, which the browser resolves to `/llm-ui/core/llm-server/ui/js/...`; the second map entry sends that to `/llm-ui/js/...`, the same URL (so the same module instance) the page uses. The first entry covers imports by file path from outside the `/llm-ui/` mount.

## Stylesheets

`css/` holds the six legacy files with identical rules and cascade order; only
em-dashes in comments were removed. They were not split: other pages link them
by these paths (the Dashboard links `base.css`, `luma-components.css` and
`live-module.css`; the PWA and share view link `chat.css`; the main window links
`luma-components.css`) and ConversationExportHtml inlines `base.css` and
`chat.css` by URL, so a split would need every one of them to follow.

| File | Holds |
|---|---|
| `base.css` | design tokens, page shell, scrollbars |
| `luma-components.css` | the `.luma-*` component library (every surface) |
| `setup.css` | Setup cards, runtimes, models, wizard, model search, Advanced |
| `chat.css` | the chat surface (`cm-` prefix) |
| `code-editor.css` | the Code surface |
| `live-module.css` | the live-module card, shared with the Dashboard and PWA |

## Globals

Read: `window.llmDiagAPI` (the [preload](../llm-tab-preload.md)),
`window.Resonant` (vendor), `window.LumaModal`. Written:
`window.LumaChatMode` ([LlmTabPage](js/page/LlmTabPage.md)),
`window.LumaChatExt` ([LumaChatExt](js/chat-ext/LumaChatExt.md)),
`window.LumaSetupExt` ([SetupExtensionTabs](js/setup-ui/extensions/SetupExtensionTabs.md)).
