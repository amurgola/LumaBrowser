# GrepTool

`extensions/code-mode/tools/project/GrepTool.js`

`grep { pattern, glob?, ignoreCase?, maxMatches? }` (a [CodeTool](../CodeTool.md)).

## Behaviour

`context.code.grep` -> `file:line: text` rows bounded by
[SearchText](SearchText.md)`.boundedBody` (`noCompact: true`); a thrown search
is `{ success: false, error }`; no matches -> `No matches for /p/.` plus the
skipped-dirs note. Summaries `/p/ · N[+] match(es)` or `/p/ · no matches`. The
required `pattern` is enforced at dispatch for every transport.
