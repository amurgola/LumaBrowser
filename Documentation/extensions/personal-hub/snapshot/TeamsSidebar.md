# TeamsSidebar

`extensions/personal-hub/snapshot/TeamsSidebar.js`

Microsoft Teams' chat list as the Hub reads it, a
[ConversationList](ConversationList.md): a Teams notification names the
person or the chat, and each row of the chat list of a signed-in Teams page
carries the chat's id beside its name. A chat opens at that id.

## Statics

- `HOSTS`: `teams.cloud.microsoft`, `teams.microsoft.com`, `teams.live.com`.
- `spaceOf(tab)`: the origin of the Teams site the tab is on (one sign-in
  has one chat list), or `null` on any other host.
- `home(origin)` = `<origin>/v2/`, which draws the chat list.
- `address(origin, id)` = `<origin>/v2/#/l/chat/<id>/conversations`, Teams'
  own deep link inside the app.
- `READY`: a list row whose value names a chat.
- `ROWS_JS` (`listedTeamsChats`): every
  `[role="treeitem"][data-fui-tree-item-value]` as `{ id, name }`. The id is
  what follows the last `|` of the row's value
  (`...OneGQL_OneOnOneChatConversation|19:..._...@unq.gbl.spaces`), the name
  the first non-empty line of the row's text (a preview of the last message
  may follow it).
- `CONVERSATION_ID`: `19:...@unq.gbl.spaces` (one to one) or
  `19:...@thread.v2` (a group chat). Copilot, the folders, communities and
  channels have other ids and are never matched.
- `KNOWN_KEY` = `teams.conversations`.

The [ConversationLocator](ConversationLocator.md) reads an opened chat from
`[data-tid="message-pane-list-viewport"]`.

## What was measured (2026-11-23)

- In a tab with no size Teams stops at its loading shell (about 250
  elements, no chat list). In a hidden tab with a viewport it is fully
  drawn within three seconds. So the list of a persisted tab restored at
  login is read in a hidden tab, and since the same day the browser tells a
  hidden persisted tab a viewport
  ([TabLayout](../../../core/browser/tab-view/TabLayout.md)).
- `<origin>/v2/#/l/chat/<id>/conversations` opened a chat that was not the
  last one open (the title became `Chat | <name> | Microsoft Teams`, the
  message pane was drawn); `<origin>/_#/l/chat/...` redirects to it.
  Three other ways failed: `<origin>/v2/#/conversations/<id>?ctx=chat` is
  ignored and the last chat opens instead (which looks like success when
  the chat asked for happens to be that one);
  `<origin>/l/chat/<id>/conversations` lands on a `Join conversation`
  launcher page; and a click made by script on the chat's row, with or
  without pointer events, changes nothing.
- The Hub had not logged one Teams notification since it began (2026-10).
  This class makes a Teams item readable; it does not make Teams notify.
- Channels of a team are not handled, only chats.
