# TargetDomain

`extensions/cdp-driver/domains/TargetDomain.js`

The Target domain, answered in-process because it manages LumaBrowser tabs. The
`filter` arrays Puppeteer and Playwright send are accepted and ignored.

## Methods

- `Target.getTargets` -> `{ targetInfos }`.
- `Target.setDiscoverTargets({ discover })`: sends `targetCreated` for every existing
  target before replying, as the spec requires.
- `Target.setAutoAttach({ autoAttach, waitForDebuggerOnStart, flatten })`: with
  autoAttach, attaches to every existing target (`Target.attachedToTarget`,
  `waitingForDebugger: false`).
- `Target.attachToTarget({ targetId })` -> `{ sessionId }`; unknown id is
  `-32602 No target with id <id>`.
- `Target.detachFromTarget({ sessionId })` sends `Target.detachedFromTarget`.
- `Target.createTarget({ url = 'about:blank', browserContextId })` opens a background
  `'cdp'` tab; a non-default context uses partition `persist:cdp-ctx-<id>`.
- `Target.closeTarget` -> `{ success }`; `Target.activateTarget` switches tabs.
- `Target.createBrowserContext` -> `{ browserContextId }`; `Target.disposeBrowserContext`
  closes its tabs and forgets it (DEFAULT is never forgotten);
  `Target.getBrowserContexts` -> `{ browserContextIds }` (never empty: Playwright needs one).
