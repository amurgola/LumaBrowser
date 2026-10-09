# MatchExcerpts

`core/llm-server/chat/web-tools/MatchExcerpts.js`

Cuts the text around each case-insensitive match of a term into excerpts.

## Methods (static)

- `extract(text, term, { radius = RADIUS, maxExcerpts = Infinity })` ->
  `{ total, excerpts: [{ start, end, text }] }`. A match inside the previous
  excerpt widens it instead of starting another; excerpt text is trimmed with
  `…` where text was skipped. `total` counts every match, shown or not.
- `RADIUS` (600 characters each side).

## Why

The `find` parameter lets the model land on one fact on a long page instead of
reading it from the top. 600 characters (about 150 tokens) holds the paragraph
or table row around a figure. [PageReport](PageReport.md) sets `maxExcerpts`
so the excerpts never outgrow one part, and tags each with its part number.
