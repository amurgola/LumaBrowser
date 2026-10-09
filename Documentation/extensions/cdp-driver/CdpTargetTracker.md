# CdpTargetTracker

`extensions/cdp-driver/CdpTargetTracker.js`

Mirrors automation-tab lifecycle into CDP targets.

## Methods

- `new CdpTargetTracker(server)`.
- `subscribe(browser)`: `onTabCreated`, `onTabClosed`, `onTabNavigated` (each skipped
  when the browser lacks it); keeps their unsubscribe functions.
- `unsubscribe()`: calls them all.

## Behaviour

- Tab created with kind `'cdp'`: registers a page target in the DEFAULT context,
  broadcasts `Target.targetCreated`, and forwards the tab's debugger events to every
  session on that target (without `sessionId` for a page socket's own session).
  User tabs never surface.
- Tab closed: sends `Target.detachedFromTarget` to each attached session, broadcasts
  `Target.targetDestroyed`, drops the target and detaches the debugger.
- Tab navigated: updates the target URL and broadcasts `Target.targetInfoChanged`.
