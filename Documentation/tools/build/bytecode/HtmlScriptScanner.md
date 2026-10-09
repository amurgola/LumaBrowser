# HtmlScriptScanner

`tools/build/bytecode/HtmlScriptScanner.js`

Collects the local `<script src>` targets of an HTML page as paths relative to a
root folder. Remote (`https:`, `data:`), protocol-relative and root-absolute
(`/x.js`, resolved against a web mount) URLs are ignored, as are targets outside
the root.

## Methods

- `HtmlScriptScanner.scripts(html, htmlAbsPath, rootDir)`
