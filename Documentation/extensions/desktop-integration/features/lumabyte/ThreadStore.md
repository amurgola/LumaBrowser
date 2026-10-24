# ThreadStore

`extensions/desktop-integration/features/lumabyte/ThreadStore.js`

Lumabyte's threads, one current and one previous per app, keyed by the program file name (`keyFor(app)`:
`excel.exe`, else the window class). Text only. One JSON file
(`{ version, threads: { key: { label, messages: [{ role, content, at }], updated } }, previous: { key: ... } }`),
written `WRITE_DELAY_MS` (400) after the last change through a temp file and a
rename; a missing, corrupt or foreign file starts fresh.

- `messages(key)`, `append(key, { role, content }, label)` (keeps the last
  `MAX_MESSAGES`, 60; past `MAX_THREADS`, 50, the oldest thread goes),
  `clear(key)` (the current thread becomes the previous one, replacing an
  older previous), `previous(key)` (`{ count, updated }` or null),
  `resume(key)` (the previous thread back as current; a current one swaps into
  previous), `flush()`.
