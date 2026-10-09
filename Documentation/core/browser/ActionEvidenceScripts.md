# ActionEvidenceScripts

`core/browser/ActionEvidenceScripts.js`

In-page JavaScript sources for action evidence: the page fingerprint and the settle observer.

## Methods

- `ActionEvidenceScripts.beforeExpr(targetExpr)` returns an EXPRESSION that
  clears old target tags, tags the element `targetExpr` evaluates to (default
  `null`), installs the settle observer and returns the fingerprint. Meant to be
  embedded inside an action script (target resolver, key dispatcher, scroll script).
- `ActionEvidenceScripts.beforeScript(targetExpr)` is the same as a standalone script.
- `ActionEvidenceScripts.pollScript()` returns `{ installed, age, mutations }`
  (`{ installed: false }` when no observer is present); a newly finished network
  resource also counts as activity.
- `ActionEvidenceScripts.installScript()` installs the observer only and evaluates to `true`.
- `ActionEvidenceScripts.finalScript({ fingerprint = true })` takes the
  after-fingerprint (or `null` when `fingerprint: false`) and removes the
  observer and target tags.
- Constants: `EVIDENCE_TARGET_ATTR` (`data-luma-evidence-target`), `SETTLE_KEY`
  (`__lumaSettle_v1`, a non-enumerable window property), `FINGERPRINT_FN_SRC`
  (defines `__lumaFp()`), `SETTLE_INSTALL_SRC`.

Every script except `beforeExpr` begins with a marker comment
(`/*luma:evidence-before*/`, `/*luma:settle-poll*/`, `/*luma:settle-install*/`,
`/*luma:settle-final*/`); test fakes dispatch on it.

## Why

The scripts run through `executeJavaScript` and cannot require anything, so
they are plain strings. Their output is byte-identical to the legacy module.

Embedding the before-snapshot in the action script costs no extra round trip.
A caller whose script returns no fingerprint (an old fake, a page that threw)
gets no evidence rather than a broken action.

The fingerprint is bounded (first 400 interactive elements, text hashed in one
pass) so it stays in the low milliseconds, and skips hidden things where cheap.
The observer ignores `data-luma-*` attribute changes, or tagging the target
would count as the page reacting.
