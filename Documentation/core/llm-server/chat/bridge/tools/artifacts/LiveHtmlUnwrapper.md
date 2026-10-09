# LiveHtmlUnwrapper

`core/llm-server/chat/bridge/tools/artifacts/LiveHtmlUnwrapper.js`

Turns a whole HTML document (sent to create_live_artifact as `content`) into
a live module's `{ html, js }`.

## Methods (all static)

- `unwrap(content)`: inline `<script>` bodies become `js` (joined by blank
  lines; external `src=` scripts are dropped); `html` is the `<body>` inner, or
  the text without doctype, `<html>`, `<head>` and `<body>` tags.
