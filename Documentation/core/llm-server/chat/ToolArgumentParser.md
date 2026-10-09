# ToolArgumentParser

`core/llm-server/chat/ToolArgumentParser.js`

Reads a native tool call's `arguments` string, repairing lone backslashes.

## Methods

- `ToolArgumentParser.parse(raw)` returns the arguments object, `{}` for empty or
  nullish input, or `null` when the text is not a JSON object even after repair
  (arrays and garbage are `null`). Repair doubles every backslash that does not
  start a legal JSON escape (`\" \\ \/ \b \f \n \r \t \uXXXX`) and parses again.

## Why

A regex argument is where this bites. `{"pattern":"(a|b):\s*true"}` is an
ordinary thing for a model to want and is not valid JSON, because `\s` is an
illegal escape, so `JSON.parse` throws on the whole object and every argument is
lost, not just the regex. Observed live: tools then ran with nothing (grep
matched the whole repo, find ignored the glob, read_file said "path is
required"), and the model spent eight calls concluding "the glob filter isn't
working in this environment" and wrote that into its answer.

Doubling the bad backslashes recovers the argument exactly as the model meant
it. Valid escapes are left alone, so a correct `\\s` or `\n` is untouched.
Windows paths are the other common source.

Returning `null` rather than `{}` matters: `{}` is indistinguishable from "the
model passed no arguments", which is how the bug stayed invisible.
