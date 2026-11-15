# TabSurfaces

`app/browser/TabSurfaces.js`

Builds the window's tab layer and the views stacked over it.

## Methods

- `new TabSurfaces(ctx, { log? })`.
- `build(win)` sets on the context:
  - `tabViewManager` ([TabViewManager](../../core/browser/TabViewManager.md))
    with the tab preload bundle (`_bundleTabPreload()`: [PreloadBundle](../../core/browser/tab-preload/PreloadBundle.md)
    joins `<root>/webview-preload.js` (`TAB_PRELOAD`) and its local requires into
    `<data dir>/preload/tab-preload.js` (`TAB_PRELOAD_BUNDLE`) on every boot, because
    web tabs are sandboxed and a sandboxed preload can require only `electron`; an
    edit to any preload module applies on the next start), the network interceptor, Chrome
    extensions, adblocker, db and favicon cache; `tabManager` over it; `vaultService.attachTabs` so the
    password manager hears each tab's preload;
  - favicon updates relayed to the shell as `tab-view:favicon`;
  - `chromeOverlay` ([ChromeOverlay](../../core/browser/ChromeOverlay.md)), re-raised
    on `tabSwitched` and when the tab preview raises; it accepts popup requests from
    every sender except a detached window's chrome, which has its own overlay;
  - `tabPreviewManager` (published `__lumaTabPreview`);
  - `onDemandOverlay` ([OnDemandOverlay](../../core/on-demand/OnDemandOverlay.md),
    published `__lumaOnDemand`) with the chat router, `ChatModeRegistry.shared`,
    the preview and [VoiceReadiness](VoiceReadiness.md) for its mic and speaker;
  - and attaches the LLM server and the dashboard to the tab manager.
