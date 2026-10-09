# runner.html, runner.js (tool-forge sandbox page)

`extensions/tool-forge/sandbox/runner.html`, `extensions/tool-forge/sandbox/runner.js`

The page [SandboxWindow](SandboxWindow.md) loads by path. `runner.html` keeps
its CSP (`default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src
'none'`) and now loads `runner.js` with `type="module"`. `runner.js` is the
page's module entry (name kept for SandboxWindow and the packaging scripts): it
starts [SandboxRunner](../ui/sandbox/SandboxRunner.md) on `window.__forge`.
