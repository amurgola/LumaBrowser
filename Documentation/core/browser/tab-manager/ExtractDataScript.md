# ExtractDataScript

`core/browser/tab-manager/ExtractDataScript.js`

The in-page script behind extract_data.

## Methods

- `ExtractDataScript.build({ baseSelector, childSelectors, preferTableStructure })`: one object per row.
  Rows that are `<tr>` with `preferTableStructure` are keyed by the table's own headers
  (`extractionMode: 'table-structure'`). Otherwise fields use [RowExtract](../extraction/RowExtract.md) and the
  script reports `duplicateFieldGroups` (fields hitting the same element in every row), `nullFields`
  (matching nothing in any row) and `constantFields` (same non-empty value in 3+ rows while others vary,
  cut at 60 chars).

## Why

Child selectors misalign on tables (`:nth-of-type` counts tag position, not class position) and sometimes point at static labels; the diagnostics let the MCP layer warn about the selectors.
