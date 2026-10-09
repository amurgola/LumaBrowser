# PowerShellJson

`core/llm-server/diagnostics/PowerShellJson.js`

Reads `ConvertTo-Json` output, which is a bare object for one row, an array
for many and empty for none.

## Methods

- `PowerShellJson.parseRows(stdout)` returns an array of rows, `[]` for empty
  or `null` output, or `null` when the text is not JSON. A leading byte-order
  mark is stripped first.
- `PowerShellJson.stripBom(text)`; `PowerShellJson.BOM` (U+FEFF, built with
  `String.fromCharCode`).
