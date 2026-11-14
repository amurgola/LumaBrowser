# BlankSlate

`tools/docs/readme-shots/BlankSlate.js`

- `CLEAR_TABLES`: messages and conversation meta, then conversations (children first: both hold a foreign key to
  `llm_conversations`, and clearing the parent first fails the whole edit); artifacts, artifact data, artifact tasks and runs;
  scheduled tasks and runs; triggers, versions, runs and deliveries; browser history, bookmarks and network watchers.
- `SET`: `core.setupComplete` true (no onboarding wizard), `core.app.autoCheckUpdates` false,
  `core.app.restoreTabs` false, `core.ui.showBookmarksBar` false, `core.llmServer.enabled` true,
  `core.llmServer.ui.mode` `chat`, `core.llmServer.openTabOnLoad` true, `core.sharing.enabled` and
  `core.sharing.web.enabled` false.
  Sharing is off because its notices carry the owner's own public address into a capture.
- `DELETE`: `core.browser.sessionTabs` and `core.browser.persistedTabs` (nothing of the owner's comes back as a
  tab), `core.llmServer.chat.lastModelRef` (the run picks its own model, see [LocalModelPick](LocalModelPick.md)),
  `core.sharing.web.publicUrl` and `core.sharing.instanceName` (the owner's address and network name).

## Methods

- `static spec()`: the `{ clearTables, set, delete }` edit spec (fresh copies).
- `static apply(dataDir)`: the AppLauncher `beforeLaunch` hook; returns the editor's `{ set, deleted, cleared }`.
