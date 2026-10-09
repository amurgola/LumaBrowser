# TabControl

`core/browser/tab-manager/TabControl.js`

Tab lifecycle for the automation layer and the `updateTab` actions, in the service envelope.

## Methods

- `new TabControl(tabViewManager)`.
- `getAllTabs({ includeSilent })` -> `{ success, tabs }`; `createTab(url, options)` -> `{ success, tab }`;
  `getConsoleLogs(tabId, options)` -> `{ success, data }`. A throw becomes `{ success: false, error }`.
- `update(page, { type, payload })`: `navigate` (TabViewManager `navigate`), `refresh` (`reload`),
  `executeJs` (`{ success, data: { result } }`), `activate` (`{ success, data: { activeTabId } }`;
  `Silent tabs cannot be activated` or `Failed to activate tab`). Other types: `Unknown action type: <type>`.

## Why

Activation brings the tab to the visible surface, which screenshot and scroll depend on; silent tabs have none.
