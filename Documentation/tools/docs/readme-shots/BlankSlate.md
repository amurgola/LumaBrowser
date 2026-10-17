# BlankSlate

`tools/docs/readme-shots/BlankSlate.js`

- `CLEAR_TABLES`: conversations, messages and conversation meta; artifacts, artifact data, artifact tasks and runs;
  scheduled tasks and runs; triggers, versions, runs and deliveries; browser history, bookmarks and network watchers.
- `SET`: `core.setupComplete` true (no onboarding wizard), `core.app.autoCheckUpdates` false,
  `core.app.restoreTabs` false, `core.ui.showBookmarksBar` false, `core.llmServer.enabled` true,
  `core.llmServer.ui.mode` `chat`, `core.llmServer.openTabOnLoad` true.
- `DELETE`: `core.browser.sessionTabs` and `core.browser.persistedTabs` (nothing of the owner's comes back as a
  tab), `core.llmServer.chat.lastModelRef` (the run picks its own model, see [LocalModelPick](LocalModelPick.md)).

## Methods

- `static spec()`: the `{ clearTables, set, delete }` edit spec (fresh copies).
- `static apply(dataDir)`: the AppLauncher `beforeLaunch` hook; returns the editor's `{ set, deleted, cleared }`.
