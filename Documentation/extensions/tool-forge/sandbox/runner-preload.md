# runner-preload.js (tool-forge)

`extensions/tool-forge/sandbox/runner-preload.js`

Preload of the sandboxed runner window (`sandbox: true`), so it stays one
CommonJS file requiring only `electron`. Exposes `window.__forge = { onExec(cb)
(`toolforge:exec`), result(msg) (send `toolforge:result`), net(msg) (invoke
`toolforge:net`) }`, nothing else.
