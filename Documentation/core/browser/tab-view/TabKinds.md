# TabKinds

`core/browser/tab-view/TabKinds.js`

The tab kinds that change how the tab layer treats a tab.

## Members

- `TabKinds.DEFAULT` (`'user'`).
- `TabKinds.AUTOMATION` (`cdp`): tabs an automation driver owns. They hold the
  webContents debugger lock, so NetworkInterceptor skips them and the identity
  override does not auto-attach children. New driver kinds go here.
- `TabKinds.INTERNAL` (`llm`, `dashboard`): app surfaces. Hidden from
  `getAllTabs()` by default so automation and AI tab pickers cannot target them;
  no error page, zoom memory, favicon cache or persistence.
- `TabKinds.INTERNAL_TAB_ID_BASE` (9000): internal tabs take ids from here.
  Automation defaults to tabId 0 when it fails to resolve a tab, so an internal
  tab must never hold a low id.
- `TabKinds.SHARED_PARTITION` (`persist:main`): every regular tab's partition, so a
  login in one tab carries to the next.
- `TabKinds.isInternal(kind)`, `TabKinds.isAutomation(kind)`.
