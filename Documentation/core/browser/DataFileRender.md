# DataFileRender

`core/browser/DataFileRender.js`

Turns a CSV/TSV download into a self-contained HTML page that renders inline in
the tab instead of triggering a save dialog.

## Methods

- `DataFileRender.isRenderableDataFile({ mimeType, filename, url })` returns
  true for CSV/TSV MIME types (parameters such as `; charset=` ignored), or for
  a generic MIME (empty, octet-stream, `application/download`, `text/plain`)
  when the filename or URL ends in `.csv`/`.tsv` (query/hash allowed).
  Everything else falls through to the normal download path.
- `DataFileRender.buildDataFileHtml(text, { filename, byteLength })` returns a
  complete HTML document: a header bar with the filename, a row/size summary
  and a Download button, then the raw text in a `<pre>`. `filename` defaults to
  `data.csv`; `byteLength` defaults to the UTF-8 length of `text`. A
  `sourceUrl` field is accepted but unused (the legacy caller passes it).
- `DataFileRender.RENDERABLE_MIME`, `RENDERABLE_EXT`, `GENERIC_MIME` and
  `DEFAULT_FILENAME` are the constants behind those rules.

## Why

Chromium treats `text/csv` as an attachment and downloads it. That is hostile
to the in-app agent, which navigates to a CSV and reads it with `get_source`:
a download leaves the tab with no DOM and prompts for a save path the agent
cannot answer.

The body is the RAW file text in one monospace block. The agent's `text`
extraction collapses runs of whitespace but keeps commas and newlines, so raw
CSV survives fully parseable; a prettified `<table>` would lose its delimiters.
The same text is embedded base64-encoded as the Download payload, because
re-fetching the URL would only trigger this inline render again. Detection is
conservative: anything not clearly CSV/TSV (zip, PDF, binaries) downloads as
before. The row count is a newline count and purely cosmetic.
