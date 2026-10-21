# SiteTab

`extensions/site-apis/runtime/SiteTab.js`

The one hidden replay tab of a site: created lazily in the site's session partition, reused across calls,
re-created when gone, and serialized so one call runs at a time per site.

## Methods

- `new SiteTab({ browser, site, logger })`.
- `withLock(fn)`: runs `fn` after every earlier call on this site has finished; result and error pass through.
- `ensure()` -> tab id. Throws `browser_unavailable` (no browser) or `site_unavailable` (the tab could not be
  created). Creates with `browser.createTab(site.startUrl, { partition: site.partition, silent: true, kind: 'user',
  activate: false, title })`, then sizes the invisible view to `SiteTab.VIEWPORT` (1280 x 900) through
  `getTabManager().tabViewManager.getEntry(id).view.setBounds` (best effort).
- `noteReply(reply)`: a reply whose error says the tab is gone (`not found`, `destroyed`) forgets the id so the
  next `ensure()` creates a fresh tab. Liveness is also checked on every `ensure()` through
  `browser.getTabs({ includeSilent: true })`.
- `close()`: closes the tab.

## Why silent, not hidden

Both options park the view invisible with zero bounds (`TabViewFactory.attach`), and both go through the same
input code: `TargetScripts.resolve` marks a target outside `window.innerWidth/innerHeight` as occluded and
`ElementClicker` / `FieldTyper` then fall back to the page-world click, so trusted input is not what decides.
The differences are:

- `silent: true` gets `backgroundThrottling: false` and a `visibilityState` pinned to `visible`
  (`TabViewFactory._webPreferences`), so timers and `requestAnimationFrame` keep running and SPA pages render
  while replaying. `hidden: true` without `keepAlive` is throttled to 1 Hz timers with paused rAF.
- `hidden: true` with `keepAlive: true` would avoid the throttling, but `TabLifecycle._register` then reserves the
  partition as a persisted tab (`PersistedTabs.reserve`), and destroying the replay tab would `forget` the
  partition the site's real persisted tab owns.
- A silent tab never enters the strip, is excluded from `getAllTabs` (so tab pickers and the agent never see
  it), refuses activation, and is destroyed (not hidden) on close.

Because a freshly created silent tab has a 0 x 0 viewport (responsive sites would lay out as a phone), the view
is given a desktop size while it stays invisible; element centers then fall inside the viewport and trusted
input (`sendInputEvent`) becomes possible, with the synthetic click still there as the fallback.
