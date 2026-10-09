# TabLoader

`core/browser/tab-view/TabLoader.js`

Loads, reloads and stops a tab's page.

## Methods

- `new TabLoader({ registry, channel })`.
- `navigate(tabId, url)` -> `{ success: true, data: { navigatedTo, loaded, finalUrl, title, httpStatus?, redirected?, loadError?, loadState? } }`.
  Waits for the load (15 s bound). ERR_ABORTED counts as loaded (the page
  redirected or replaced the load); other errors set `loaded: false` and
  `loadError`; a timeout sets `loadState`. `success` stays true for a live tab:
  the load outcome is the data.
- `waitForLoad(tabId, timeoutMs = 15000)` -> `{ success, loaded }`; resolves at once
  when idle, else on `did-stop-loading` or the timeout.
- `reload(tabId, { ignoreCache })`: from the error page, retries the original URL.
- `stop(tabId)`: stops and clears the spinner.
