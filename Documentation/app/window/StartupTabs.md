# StartupTabs

`app/window/StartupTabs.js`

Opens the first tabs once the shell has painted.

## Methods

- `new StartupTabs({ getTabViewManager, llmServerService, db, bookmarkService, log?, setImmediateFn?, setTimeoutFn? })`.
- `open()` false when there is no tab manager or the strip already has tabs (a
  renderer reload). Otherwise, with the start page from `startPageUrl` (default
  [BrowserDataPreferences](../../core/browser-data/BrowserDataPreferences.md)`.DEFAULT_START_PAGE`):
  - LLM server enabled and set as the default tab: on the next tick, the pinned
    LLM tab (focused, first in the strip), the start page behind it, then the
    startup bookmarks;
  - otherwise: the start page, the startup bookmarks, and 1.5 s later the
    pinned LLM tab in the background when the server is enabled;
  - after 3 s: `restorePersistedTabs()` (logged `Restored <n> persisted tab(s) in the background`)
    and `startKeepAliveSweep()`, which starts even when the restore failed.
  Bookmark and restore failures are warnings.

## Why

Tab creation waits a tick so the shell gets a clean first paint before two tab
renderers contend for CPU and GPU; the heavier LLM tab goes second unless it is
the tab the user will see.
