# ExtractionReply

`core/browser/mcp/ExtractionReply.js`

Builds the data of a `browser_extract_data` reply.

## Methods

- `ExtractionReply.build(baseSelector, result, childSelectors)` returns
  `{ baseSelector, rows: result.data, rowCount }`, plus `extractionMode: 'table-structure'` and
  `TABLE_NOTE` for table-kind items, plus `childSelectorWarning` from
  [ChildSelectorWarning](ChildSelectorWarning.md).
