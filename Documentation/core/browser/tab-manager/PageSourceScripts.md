# PageSourceScripts

`core/browser/tab-manager/PageSourceScripts.js`

The in-page scripts behind `getTabSource`, one per extraction type. The HTML and text types can be
narrowed to the elements a CSS selector matches.

## Methods

- `PageSourceScripts.forType(type, selector = null)`: the script for `type`, falling back to `clean` for
  unknown types (including Object prototype names). With a selector and a type that can be narrowed, the
  script reads only the selector's matches: every match, in page order.
- `PageSourceScripts.canScope(type)`: true for `full`, `markdown`, `text`, `clean` and `minimal`; the
  structured types (`analyze`, `structural`, `semanticTree`) ignore a selector.
- `PageSourceScripts.matchCount(selector)`: a script answering `{ count }`, or `{ error }` for a selector
  the page cannot parse.
- `BY_TYPE`: `structural` ([StructuralSummaryScript](../extraction/StructuralSummaryScript.md)), `semanticTree`
  ([SemanticTreeScript](../extraction/SemanticTreeScript.md)), `full`, `markdown`, `text`, `clean`, `minimal`,
  `analyze` ([PageAnalysisScript](PageAnalysisScript.md)): the whole-page scripts.
- `SCOPED`: per narrowable type, the builder that takes a roots expression.
- Constants: `DEFAULT_TYPE` (`clean`), `FULL`, `MARKDOWN`, `TEXT`, `CLEAN`, `MINIMAL`, and the whole-page
  roots `DOCUMENT_ROOTS` (`<html>`) and `BODY_ROOTS` (`<body>`, else `<html>`).

## What each type reads

- `full`: `outerHTML`. The whole page is `document.documentElement.outerHTML`; narrowed, the matches
  joined with newlines.
- `markdown`: the same HTML step, from `<body>` to drop `<head>` noise; [PageSource](PageSource.md)
  converts it Node-side.
- `text`: `innerText` of the live elements, whitespace collapsed and blank runs cut to one empty line,
  with the page title on top for a whole-page read. Matches are separated by an empty line.
- `clean`: a copy without `<head>`, scripts, styles, comments, empty tags, inline images and every
  attribute outside a short allowlist (id, class, href, src, alt, title, type, name, placeholder, value,
  for, aria-label, role, action, method), on one line.
- `minimal`: a copy without `<head>`, scripts, styles, `nav`, `footer` and `aside`, keeping only `id` and
  `class`, one tag per line.

Cleaning applies to the root element itself as well as its descendants, so a narrowed read does not keep
the matched element's own `style` or `data-*` attributes.

## Why

`text` reads the live elements, not a detached copy: `innerText` follows the rendered layout, so blocks,
list items and table cells come out on their own lines, and hidden content is left out. A detached copy
has no layout and reads as `textContent`, every element glued to the next (`US $499.99Free shipping45 bids`).

A selector exists because a page's header, menus and footer are most of its source: `main` or one
results list is often a tenth of the whole.
