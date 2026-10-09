# ChatSubscriptions

`core/llm-server/ui/js/chat/ChatSubscriptions.js`

Subscribes the chat to the host's pushes. Every push is optional on the API.

## Methods

- `install()` (async):
  - `onChatEvent` to [ChatEventRouter](stream/ChatEventRouter.md);
  - `tabPreview.onFrame` to [TabPreviewCard](turns/TabPreviewCard.md), and
    `tabPreview.getEnabled()` into `state.tabPreviewEnabled`;
  - `onOpenConversation(id)` opens it (the Dashboard's deep link);
  - `onSchedTasksEvent` / `onTriggersEvent`: refresh the sidebar, re-open the
    runs view showing that task or trigger, mirror a renamed setup chat in the
    top bar; a trigger `'open'` event deep-links to its runs view;
  - `onServerEvent`: `'providers-changed'` re-lists models; `'state-change'`
    re-probes the thinking dial (forced only on `'ready'`), applies the server
    state to [Availability](composer/Availability.md) and re-lists models;
  - `onServerState` to Availability.
