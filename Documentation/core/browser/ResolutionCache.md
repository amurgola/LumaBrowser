# ResolutionCache

`core/browser/ResolutionCache.js`

Replays described actions ("the Save button") without asking a model again.
Resolving a description costs an LLM call (the selector resolver) or a vision
call (a grounding model plus a screenshot); agents and scheduled tasks repeat
the same descriptions on the same pages constantly. The answer is remembered as
a robust CSS selector keyed by page pattern, action group and description
([ResolutionCacheKey](resolution-cache/ResolutionCacheKey.md)), and replayed
after a live check that the selector still names one visible element with the
same tag and similar text. Anything doubtful is a miss, and the caller falls
through to the model as before.

Extends [ResolutionCacheStore](resolution-cache/ResolutionCacheStore.md) (LRU
entries, expiry, miss bookkeeping, persistence).

## Methods

- `new ResolutionCache({ store, maxEntries = 2000, ttlMs = 30 days, maxSoftMisses = 3, saveDelayMs = 2000, now })`;
  `store` is the SettingsDatabase (or null for memory only).
- `isEnabled()`: false only when setting `core.browser.resolutionCache.enabled` is `false`.
- `replay(tabManager, tabId, description, kind, { pointCheck = true, requireExact = false })`
  -> `{ key, entry, selector, exact, x, y, bbox, target }` or null. Validates the
  entry in the page ([ResolutionCachePage](ResolutionCachePage.md)`.validateScript`).
  A hard failure (no match, ambiguous, text or tag changed) drops the entry; a
  soft one (hidden, covered, off screen) counts toward `maxSoftMisses`; a check
  that could not run (tab busy) records nothing. `requireExact` also drops entries
  whose selector's first match is not the validated element. On success the
  caller acts, then reports `noteHit(key)` or `noteMiss(key)`.
- `capture(tabManager, tabId, { point } | { selector })` -> `{ href, selector, tag, role, text, rect }`
  or null: the robust selector for the element at a viewport point (a vision
  answer) or for a selector (an LLM answer). Must run before the action, since a
  click may navigate away.
- `remember(description, kind, captured, source)`: stores a capture (keyed on its
  `href`) as `'llm'` or `'vision'`.
- Inherited: `get`, `put`, `delete`, `clear`, `noteHit`, `noteMiss`, `stats`, `flush`.
- `ResolutionCache.STORAGE_KEY` (`core.browser.resolutionCache`), `ResolutionCache.ENABLED_SETTING`,
  `ResolutionCache.debug` (env `RESOLUTION_CACHE_DEBUG=1` or `LLM_FALLBACK_DEBUG`).

`tabManager` needs `updateTab(tabId, { type: 'executeJs', payload })` and either
`tabViewManager.getEntry` or `getAllTabs` ([TabPageAccess](resolution-cache/TabPageAccess.md)).

Callers: [LlmFallbackOrchestrator](LlmFallbackOrchestrator.md) (via
`LlmFallbackService.resolutionCache`, `pointCheck: false, requireExact: true`) and
[VisualGroundingService](vision/VisualGroundingService.md) (kind `locate`).
main.js builds one with the settings db and hands it to both.
