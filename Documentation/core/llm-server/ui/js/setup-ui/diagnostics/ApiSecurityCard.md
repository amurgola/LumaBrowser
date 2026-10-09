# ApiSecurityCard

`core/llm-server/ui/js/setup-ui/diagnostics/ApiSecurityCard.js`

The Server Info "API Security" card: whether the local LLM and Image servers are gated by a Bearer key right now.

## Methods

- `render(doc, apiSecurity, pillId?, bodyId?)`: soft-fails ("n/a") without a getter and reports a read error; `view(cfg)`: `{ pillClass, pillText, html }` (the html is static copy plus the key count).

## Globals

Reads `document` by id.
