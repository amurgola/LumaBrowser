# TabLoader

`core/browser/tab-view/TabLoader.js`

Loads, reloads and stops a tab's page.

## Methods

- `new TabLoader({ registry, channel })`.
- `navigate(tabId, url)` -> `{ success: true, data: { navigatedTo, loaded, finalUrl, title, httpStatus?, redirected?, loadError?, loadState? } }`.
  Waits for the load (15 s bound). ERR_ABORTED counts as loaded (the page
  redirected or replaced the load); other errors set `loaded: false` and
  `loadError`; a timeout sets `loadState`. `success` stays true for a live tab:
  the load outcome is the data. Two waits make the report true for a tab that was
  made a moment ago, see below.
- `waitForLoad(tabId, timeoutMs = 15000)` -> `{ success, loaded }`; resolves at once
  when idle, else on `did-stop-loading` or the timeout.
- `reload(tabId, { ignoreCache })`: from the error page, retries the original URL.
- `stop(tabId)`: stops and clears the spinner.

## A tab navigated the moment it was made (2026-11-18)

Every chat agent turn that browses opens a work tab at `about:blank` and navigates it
a few milliseconds later. Until this date its first `navigate` told the model the page
had "redirected to about:blank": on the prompt bench Qwen3.8-27B navigated a second
time in every run, and Gemma 4 E4B once gave up and told the user the page could not be
loaded. Two things were wrong, both measured in the running app.

1. **The renderer crashed.** When the navigation started while the tab's first
   document was still committing, the tab's renderer went down (`render-process-gone`,
   reason `crashed`, exit code 0xC0000005, Electron 45), the navigation died with it and
   crash recovery reloaded about:blank. Seen on every work tab opened by a chat turn; a
   tab made right at boot did not crash. `navigate` now waits for a first document that
   is still loading (`_afterFirstDocument`: the tab is loading and has no URL yet) to
   stop, for at most `FIRST_DOCUMENT_WAIT_MS` (3 s; it takes about 40 ms). With the wait
   the same turn shows no crash and one navigation, committed with HTTP 200.
2. **The report was read too early.** `loadURL` can settle before its own page
   arrives, because a load already under way finishes first and ends the wait. In the
   run without a crash the call returned at 27 ms naming about:blank while the page
   committed at 52 ms. So when `loadURL` settles while the tab is still loading and has
   not reached the requested URL, the report waits for the load to stop
   (`_untilArrived`, within what is left of the 15 s) before reading the final URL and
   title; a page that still has not arrived is `loaded: false` with
   `loadState: 'still loading'`. A page already at the requested URL is not waited on,
   so slow frames or ads on a loaded page do not hold the report.

A first load that is being held for Chrome extensions
([TabLifecycle](TabLifecycle.md)) is not loading yet, so it is not waited on here.
