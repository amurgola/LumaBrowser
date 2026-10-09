# ActionWatcher

`core/browser/ActionWatcher.js`

Watches one input action on a tab and turns what happened into evidence.

## Methods

- `new ActionWatcher(wc, { tabId, tabViewManager })` attaches
  `did-start-navigation`, `did-navigate` and `did-navigate-in-page` listeners on
  `wc`, and `tabCreated` on the tab view manager (tabs whose `openerTabId` is
  `tabId` count as opened by the action). Create it BEFORE the action: a
  navigation can start synchronously with the input. Main-frame events only.
- `watcher.finish({ before, legacyWaitMs, quietMs, maxMs })` returns
  `{ navigated, evidence, after }` and always detaches.
  - With `before` (the fingerprint the action script returned): settles the
    page (stopping early on a cross-document commit), gives a started but
    uncommitted navigation up to 3 s from the start of `finish`, takes the
    after-snapshot unless the document was replaced, and builds evidence with
    `ActionEvidence.compare`.
  - Without it: waits up to `legacyWaitMs` for a navigation commit and returns
    `evidence: null, after: null`; no page script runs.
- `watcher.cancel(before)` detaches listeners (idempotent). When `before` is a
  fingerprint, the action script already installed the in-page observer, so it
  is torn down in the background.
- `watcher.state` is `{ started, committed, inPage, newTabs }`.
- Constants: `NAV_GRACE_MS` (3000), `NO_ANSWER_GRACE_MS` (1000, the extra wait
  when the after-snapshot did not answer, in case the page is navigating).
