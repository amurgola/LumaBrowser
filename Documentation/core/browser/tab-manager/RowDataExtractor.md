# RowDataExtractor

`core/browser/tab-manager/RowDataExtractor.js`

extract_data: runs the row script and passes on only the diagnostics that found something.

## Methods

- `RowDataExtractor.extract(page, { baseSelector, childSelectors, preferTableStructure })` -> `{ success, data, rowCount, extractionMode?, duplicateFieldGroups?, nullFields?, constantFields? }`. A page that answers nothing reads `In-page script returned no result`.
