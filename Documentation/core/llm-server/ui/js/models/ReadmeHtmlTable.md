# ReadmeHtmlTable

`core/llm-server/ui/js/models/ReadmeHtmlTable.js`

Rebuilds a raw HTML `<table>` body as a clean `.ms-table`: cell text through ReadmeInline, `colspan` kept (capped at 32), the first row a `<thead>` only when every cell is a `<th>`.

## Methods

- `ReadmeHtmlTable.render(body, inline)`; `''` when the body has no rows.

## Globals

None.
