# AgentToolExecutor

`core/llm-server/agent/AgentToolExecutor.js`

Executes one agent tool call on the working tab.

## Methods

- `new AgentToolExecutor({ browserTools, browserService, screenshotVision,
  wait })`. `wait(ms)` defaults to a real timer (tests pass a no-op).
- `execute(tool, params, defaultTabId)` never throws; a failure is
  `{ success: false, error }`.

## Routing

- Missing params become `{}`. The lazy sentinel (-1) and a missing `tabId` map
  to `defaultTabId`, which is folded back into params when it is a real id.
- `navigate`: on success waits 1500 ms, waits out an interstitial
  ([InterstitialWait](InterstitialWait.md)`.settle`; `options.interstitialWait`
  is a test seam), then attaches the element digest
  ([TabLookup](TabLookup.md)`.attachDigest`). A waited-out interstitial sets
  `result.note` to "The page asked to wait; after Ns it moved on by itself to
  <url>. The elements below are that page."; one that never moved sets
  `InterstitialWait.STILL_WAITING_NOTE`. Skipped without `browserService.executeJs`.
- `create_tab` with a url: same, on the new tab.
- `click`, `type`, `click_at`, `locate`: on a URL change, wait 800 ms, wait out
  an interstitial the same way, and attach the new page's digest (the old
  page's refs died with it).
- `screenshot`: on a vision run with pixels, `{ message: SCREENSHOT_ATTACHED +
  size + marks, imageBase64, mimeType }`; otherwise the explicit
  "pixels are NOT visible" message.
- Anything else goes straight to `browserTools.executeTool(tool, params, browserService)`.
