# TabSurfaces

`app/browser/TabSurfaces.js`

Builds the window's tab layer and the views stacked over it.

## Methods

- `new TabSurfaces(ctx, { log? })`.
- `build(win)` sets on the context:
  - `tabViewManager` ([TabViewManager](../../core/browser/TabViewManager.md))
    with `<root>/webview-preload.js`, the network interceptor, Chrome
    extensions, adblocker, db and favicon cache; `tabManager` over it;
  - favicon updates relayed to the shell as `tab-view:favicon`;
  - `chromeOverlay` ([ChromeOverlay](../../core/browser/ChromeOverlay.md)), re-raised
    on `tabSwitched` and when the tab preview raises;
  - `tabPreviewManager` (published `__lumaTabPreview`);
  - `onDemandOverlay` ([OnDemandOverlay](../../core/on-demand/OnDemandOverlay.md),
    published `__lumaOnDemand`) with the chat router, `ChatModeRegistry.shared`,
    the preview and [VoiceReadiness](VoiceReadiness.md) for its mic and speaker;
  - and attaches the LLM server and the dashboard to the tab manager.
