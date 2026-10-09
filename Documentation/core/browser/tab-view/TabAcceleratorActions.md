# TabAcceleratorActions

`core/browser/tab-view/TabAcceleratorActions.js`

Runs the browser shortcuts the main process handles itself
([Accelerators](../Accelerators.md)`.MAIN_HANDLED`) against a tab.

## Methods

- `new TabAcceleratorActions(tabs)`; `tabs` is the TabViewManager.
- `perform(entry, action)`: `reload`, `hard-reload` (ignore cache), `back`,
  `forward`, `stop`, `zoom-in` / `zoom-out` (0.1 steps), `zoom-reset`, `devtools`,
  `print`. Other actions are the renderer's and do nothing here.

Exposed as `TabViewManager.performAccelerator(entry, action)`.
