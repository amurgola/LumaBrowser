# AutomationServices

`app/browser/AutomationServices.js`

Builds browser automation on top of the window's tabs.

## Methods

- `new AutomationServices(ctx)`.
- `build(win)` returns `{ browserService, llmFallbackService, desktopService }`:
  - [LlmFallbackService](../../core/browser/LlmFallbackService.md) with a
    [ResolutionCache](../../core/browser/ResolutionCache.md) over the db
    (published `__lumaResolutionCache`, flushed at quit);
  - REST routes: `/api/browser` ([BrowserRoutes](../../core/browser/BrowserRoutes.md)
    over BrowserController) and the health endpoints;
  - [BrowserService](../../core/browser/BrowserService.md) (`ctx.browserService`);
  - [VisualGroundingService](../../core/browser/vision/VisualGroundingService.md)
    sharing the resolution cache, set on BrowserService (published `__lumaVisualGrounding`);
  - [DesktopService](../../core/desktop/DesktopService.md) (published `__lumaDesktop`,
    off until the user enables it) and its `core.desktop.*` IPC;
  - TabViewManager `viewAttached`, `tabCreated`, `tabClosed`, `tabNavigated`
    forwarded through BrowserService (`viewAttached` as `webviewAttached`).
