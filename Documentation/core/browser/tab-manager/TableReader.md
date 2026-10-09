# TableReader

`core/browser/tab-manager/TableReader.js`

get_table for real tables and div layouts.

## Methods

- `TableReader.read(page, { selector = 'table', rowSelector, cellSelector })` -> `data: { headers, rows, rowCount }`.
  A `<table>` gives its header row and body rows; otherwise rows come from the row and cell selectors or
  the container's children, with the first row as the header.
- `TableReader.script(options)`.
