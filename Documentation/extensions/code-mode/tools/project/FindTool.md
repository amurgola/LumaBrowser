# FindTool

`extensions/code-mode/tools/project/FindTool.js`

`find { glob, maxResults? }` (a [CodeTool](../CodeTool.md)).

## Behaviour

`context.code.find` -> relative paths bounded by [SearchText](SearchText.md)
(`noCompact: true`); none -> `No files match <glob>.` plus the skipped-dirs
note. Summaries `<glob> · N[+] file(s)` or `<glob> · no files`. The required
`glob` is enforced at dispatch.
