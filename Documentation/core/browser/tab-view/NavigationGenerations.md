# NavigationGenerations

`core/browser/tab-view/NavigationGenerations.js`

Decides whether a tab load event still belongs to the navigation the tab is on.

## Methods

- `NavigationGenerations.fresh()` the initial state
  `{ navGen: 0, committedGen: 0, pendingGen: null, pendingUrl: null, committedUrl: null }`.
- `NavigationGenerations.decide(nav, kind, payload)` returns `{ apply, nav, gen?, reason? }`;
  `nav` is the next state, the input is never mutated. Kinds and payloads:
  `start { url, isMainFrame, isSameDocument }`, `redirect { url, isMainFrame }`,
  `commit { url }`, `fail { url, errorCode, isMainFrame }`, `finish`/`stop { isLoading }`,
  `inPage { url, isMainFrame }`, `title`. Unknown kinds apply.
- `NavigationGenerations.normalizeUrl(url)` parses to `href`, or returns the input
  (or `''` for non-strings).

## Rules

Chromium's load events carry no navigation id, so a completion for a navigation
the user has moved on from (a slow DNS failure arriving after the next link was
clicked, a stale document's title, a finish for the page being left) could
overwrite newer state. Every main-frame document navigation bumps `navGen`; the
one in flight is pending until it commits or fails.

- start: a non-same-document main-frame start opens a new generation.
- redirect: moves the pending url, so a failure after a redirect still matches.
- commit: the latest generation becomes the committed document.
- fail: a main-frame failure matching neither the pending nor the committed url is
  stale and ignored; one matching the pending navigation settles it. ERR_ABORTED
  (-3) and code 0 settle without being an error (`reason: 'aborted'`).
- finish / stop: ignored while a newer navigation is pending and still loading.
- inPage: updates the committed url only, and never while a document navigation is pending.
- title: ignored while a newer document navigation is pending.

[TabEntry](TabEntry.md)`.applyNavEvent` stores the next state on the entry;
[TabLoadEvents](TabLoadEvents.md) runs every load event through it, and
[TabErrorPage](TabErrorPage.md) refuses to paint over a newer generation.
