# ArtifactsSidebar

`core/llm-server/ui/js/chat/sidebar/ArtifactsSidebar.js`

The sidebar's two artifact views sharing one pane: the open conversation's
artifacts (the top-bar Artifacts button, which only shows when there are some)
and every chain saved on the device (All artifacts), with version history,
open, jump-to-conversation and delete.

## Methods

- `applyMode()`: shows the chats list or the artifacts pane.
- `toggleScoped()`, `toggleAll()`: a second click returns to the chats list.
- `returnToChats()`, `applyButtons()`, `repaintIfShowing()`.
- `refreshTopbarCount()`: the badge; hides the button at zero and leaves a
  now-empty scoped view.
- `renderScoped()`, `renderAll()` (the store's total size in the header).
- `onClick(e)`: a conversation link opens it, the version badge toggles a
  lazily loaded history, a version row opens in the panel, the trash confirms
  (naming every version) and deletes the chain, a row opens the artifact.
