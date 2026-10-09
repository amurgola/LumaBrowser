# LookupReply

`core/llm-server/chat/web-tools/LookupReply.js`

The shape and voice of every web lookup result.

## Methods (static)

- `ok(message, extra)` -> `{ success: true, ...extra, message }`.
- `fail(problem, nextStep?)` -> `{ success: false, error: '<problem> <nextStep>' }`.
- `reasonOf(errorText)`: an error's text minus SafeFetch's transport prefix and
  a trailing period, so reasons are not wrapped twice.
- `today()`: the ISO date stamped on results.
- `SEARCH_INSTEAD`: "do not guess or edit the URL path; search and open by
  number". `OTHER_SOURCE`: "the address is probably right; use a different source".

## Why

Every failure states what happened and then exactly one next step, so the model
acts instead of retrying the same call. The two advice texts separate "this page
does not exist" (stop guessing paths) from "this site blocks readers" (the URL
is fine; go elsewhere). The date gives local models an anchor against stale
pages and snippets.
