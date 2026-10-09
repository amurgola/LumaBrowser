# CdpDefaults

`extensions/cdp-driver/CdpDefaults.js`

## Constants

- `AUTOMATION_TAB_KIND = 'cdp'`: only tabs of this kind become CDP targets (core's
  [TabKinds](../../core/browser/tab-view/TabKinds.md) lists it as an automation kind,
  so NetworkInterceptor leaves its debugger alone).
- `DEFAULT_BROWSER_CONTEXT_ID = 'DEFAULT'`: the context advertised on connect so
  Playwright's `browser.contexts()[0]` resolves.
