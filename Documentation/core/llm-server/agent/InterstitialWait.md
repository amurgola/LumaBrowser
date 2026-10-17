# InterstitialWait

`core/llm-server/agent/InterstitialWait.js`

After a navigation settles, notices a page that says it will move on by itself
and waits for it to do so. Used by [AgentToolExecutor](AgentToolExecutor.md)
after `navigate`, `create_tab` and URL-changing page actions.

## Methods

- `new InterstitialWait({ browserService, sleep, now })`: `browserService.executeJs`
  runs `PROBE_SCRIPT` (a plain function's source returning `{ url, refresh,
  text (first 2000 chars of body text), chars, ready }`).
- `settle(tabId)` returns `null` when the page is not an interstitial (one
  probe, no waiting), else polls every `POLL_MS` (500) for up to `MAX_WAIT_MS`
  (20 s) and returns `{ moved, from, to, waitedMs }`. It has moved on when a
  probe answers with `ready: 'complete'` and is no longer an interstitial: a
  new page, or the same URL whose notice cleared in place (a loading screen). A
  probe that fails mid-navigation counts as not yet.
- `InterstitialWait.isInterstitial(probe)`: a meta refresh, or body text of at
  most `MAX_TEXT_CHARS` (1500) matching `CUES` (please wait, one moment, just a
  moment, redirecting, you will be redirected/forwarded/taken, forwarding you,
  taking you to, checking your browser, verifying you are human, security check).
- `STILL_WAITING_NOTE`: the note for a page that never moved: do not navigate
  again (that restarts the wait), observe again later or ask the user.

## Why

A site's "hold on, we'll forward you" page reads to the model like the page it
asked for (a login form, an error), so it navigated again, which restarted the
countdown; the agent never got through, while the user, who waited, did.
