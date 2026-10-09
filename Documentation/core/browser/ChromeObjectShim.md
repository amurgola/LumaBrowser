# ChromeObjectShim

`core/browser/ChromeObjectShim.js`

Page source that gives `window.chrome` the `loadTimes`, `csi` and `app`
members stock Chrome has, so detectors cannot spot Electron's empty object.

## Methods

- `ChromeObjectShim.SOURCE` is the self-invoking page script (a string). It
  creates `window.chrome` if missing, skips any member that already exists, and
  does nothing if `window.chrome` is not an object.

## Why

Stock Chrome gives every page `window.chrome = { loadTimes, csi, app }`;
Electron gives an empty object, which bot detectors test for. The functions are
callable Proxies over plain function expressions: V8 prints any callable Proxy
as `function () { [native code] }`, while `name`, `prototype` and `length`
still come from the target.

It is injected twice: natively by the identity layer via
`Page.addScriptToEvaluateOnNewDocument` (main world, before page scripts, every
frame including OOPIFs and same-origin about:blank iframes), and again by
`webview-preload.js` for the main frame, because Electron replaces
`window.chrome` there after the CDP script runs. The preload runs in a renderer
process that cannot load main-process bytecode, so this file must stay a plain
string with no requires and must stay on the bytecode compiler's skip list.
