# manifest

`extensions/site-apis/manifest.js`

The Site APIs manifest: id `site-apis`, the three `site_api_*` tables and `core:browser` as required dependencies,
`core:llm-service` optional (selector recovery and the LLM transform step), a top-level Settings tab (`Site APIs`,
`settings.html`), `main.js` and `renderer.js`, routes at `/api/site-apis`, `mcp-tools.js` (the management tools)
and `chat-modes.js` (the builder mode).
