# open feature

`extensions/desktop-integration/features/open/index.js`

Lets desktop clients send Luma a link, a web search or a question: a launcher,
a hotkey script, or the Windhawk mod
[luma-link-redirect](../../../../integrations/windhawk/luma-link-redirect.wh.md)
that catches the links Windows forces into Microsoft Edge. On by default.
Nothing here knows which client calls.

Parts: [LinkUnwrap](LinkUnwrap.md) (Edge and Bing wrappers, pure),
[OpenText](OpenText.md) (free text to an action, pure),
[OpenActions](OpenActions.md) (opens the tab, runs the search, hands off to
chat).

## Routes (token required)

All answers use the envelope `{ success: true, ... }` / `{ success: false, error }`.

### `GET /api/desktop/open/`

`{ success, askPrefix, unwrapLinks, bingSearchesAsQuery, searchEngine: { id, name, url } }`:
what a client needs to mirror Luma's behavior (the engine is the one the user
picked for the omnibox, `url` holds `%s` for the terms).

### `POST /api/desktop/open/`

Exactly one of:

- `{ url, unwrap?, focus? }`: opens `url` in a new user tab
  (`browser.createTab(url, { kind: 'user' })`) and raises the main window
  (`windows.focusMainWindow()`). Unless `unwrap: false` (or the `unwrapLinks`
  setting is off), the link goes through [LinkUnwrap](LinkUnwrap.md) first: a
  `microsoft-edge:` link or a Bing redirect opens its real target; a Bing
  search becomes a search with Luma's engine (while `bingSearchesAsQuery` is
  on). Only `http` and `https` targets open.
  -> `{ success, action: 'url', url, tabId, focused, from? }` (`from` is the
  original link when it was unwrapped), or the `query` answer below.
- `{ query, focus? }`: opens the results page of Luma's search engine
  (core [SearchEngines](../../../../core/browser/SearchEngines.md), stored under
  the `searchEngine` setting; DuckDuckGo by default).
  -> `{ success, action: 'query', query, url, engine, tabId, focused }`.
- `{ ask, app?, windowTitle? }`: a new chat conversation through
  [ChatHandoff](../../shared/ChatHandoff.md) (`autoSend` per the
  `askAutoSend` setting; `source` is `{ client: X-Luma-Client, app, windowTitle }`).
  -> `{ success, action: 'ask', conversationId, autoSent }`.

`focus: false` skips raising the window for that call. Errors: 400 for a bad
body (none or several of the keys, a non-string, empty, too long: url 8192,
query 2048, ask 100000 characters, a non-web scheme), 503 when the browser or
the chat handoff is not available, 500 when the tab cannot be created, 502 when
the handoff fails.

### `POST /api/desktop/open/text`

`{ text, focus?, app?, windowTitle? }`: one line of free text, classified by
[OpenText](OpenText.md): text that starts with the ask prefix (default `?`)
goes to the chat; a link (with a scheme, a bare host like `example.com/docs`
or `localhost:3000`, or an Edge or Bing wrapped one) opens; anything else is a
web search. Answers as above. A wrapped Bing search stays a Bing page when
`bingSearchesAsQuery` is off.

### `POST /api/desktop/open/unwrap`

`{ link }` -> `{ success, kind: 'url', url, news, wrapped }` or
`{ success, kind: 'query', query, url, wrapped }`; 400 for a link that is not
a web link. Opens nothing.

## Settings (`settingsSchema`)

| Key | Type | Default | What |
| --- | --- | --- | --- |
| `askPrefix` | text | `?` | prefix that sends `/open/text` to the chat; empty turns it off |
| `askAutoSend` | bool | true | send the question right away (else only fill the composer) |
| `focusWindow` | bool | true | raise Luma after opening a link or a search |
| `unwrapLinks` | bool | true | unwrap Edge and Bing links sent as `{ url }` |
| `bingSearchesAsQuery` | bool | true | a Bing search link becomes a search with Luma's engine |

## Example

```powershell
$h = Get-Content "$env:USERPROFILE\.lumabrowser\desktop.json" | ConvertFrom-Json
$hdr = @{ 'X-Luma-Desktop-Token' = $h.token; 'X-Luma-Client' = 'powershell/1' }
Invoke-RestMethod -Method Post "http://127.0.0.1:$($h.port)$($h.apiBase)/open/text" -Headers $hdr -ContentType 'application/json' -Body '{"text":"? what is a monad"}'
```

Clients that raise Luma should call `AllowSetForegroundWindow(<handshake pid>)`
first (README section 4).
