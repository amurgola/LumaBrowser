# ConversationList

`core/llm-server/ui/js/chat/sidebar/ConversationList.js`

The sidebar's reactive conversations list, rendered through the `cmConvRow`
ResonantJs template into `cm.visible` so a repaint touches only changed rows.
Scheduled tasks, then triggers sit above every conversation group (hidden while
searching); conversation rows carry a mode tag for extension modes.

## Methods

- `registerTemplates()`: the `cmConvTitle` transform (pin dot plus escaped
  title), the `cmConvRow` and `cmEmptyChats` templates, and the `open`, `menu`
  and `groupdel` handlers (a task row opens its runs view, a trigger row its
  view, a conversation row the conversation; menus likewise).
- `registerList()`: adds the `cm` namespace.
- `render(list)`, `rebuild()` (also re-syncs the mode launcher highlight).
- `refresh()`: conversations, then (when the API has them) tasks and triggers,
  then `repaintCurrent()`.
- `repaintCurrent()`: whichever list the user is looking at (chats, or either
  artifacts view).
- `search(q)`: `api.conv.search`; an empty term restores the full list.
- `deleteGroup(label)`: confirms, deletes every conversation in that date
  group, falls back to the landing when the open one went.
- `modeTag(mode)`: the mode's label, its raw id until labels load, `''` for chat.
