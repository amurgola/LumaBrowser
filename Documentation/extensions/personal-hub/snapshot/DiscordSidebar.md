# DiscordSidebar

`extensions/personal-hub/snapshot/DiscordSidebar.js`

Discord's conversation lists as the Hub reads them, a
[ConversationList](ConversationList.md): a Discord notification names the
channel (and its category) or the person, never the server or an address. A
signed-in Discord page lists the direct messages, and the channels of the
one server it is on, each with its address.

## Statics

- `spaceOf(tab)`: `discord` for a tab on `discord.com` (one sign-in has one
  set of servers), else `null`. `home()` =
  `https://discord.com/channels/@me`. `address(space, id)` =
  `https://discord.com/channels/<id>`.
- `CONVERSATION_ID`: `@me/<channel>` (a direct or group message) or
  `<server>/<channel>`.
- `ROWS_JS`: what a tab lists as it stands, direct and group messages only
  (`listedDiscordConversations`, filtered to `@me/`). One server's channel
  list cannot tell whether a name is shared with another server, so
  channels are never learned from a tab as it stands.
- `SCAN_JS` (`walkDiscordServers`), run in the hidden tab: unfolds every
  folded server folder, opens each server in turn (a click, then up to 2.5 s
  for its channel list), lists what each shows, and folds the folders
  again. Answers everything listed on the way, each row once.
- `conversations(rows)`: as the base, then every name listed under more
  than one id is left out: the `#general` of two servers names no
  conversation, since reading the wrong server would be a guess.
- `key(name)`: lower case and trimmed; the `#` stays, a person may be
  called what a channel is.
- `READY`: the server list. `KNOWN_KEY` = `discord.conversations`.

## Names

`listedDiscordConversations` names a row the way
[NotificationClassifier](../inbox/NotificationClassifier.md) titles the
item:

| Row | Label on the page | Name |
|---|---|---|
| direct message | `Crow (direct message), Online` | `Crow` |
| group message | `bonca95, Leao (group message), 3 Members` | `bonca95, Leao` |
| channel in a category | `unread, general-chat (text channel)` after `D&D Chats (category)` | `#general-chat (D&D Chats)` |
| channel without one | `useful-links (text channel)` | `#useful-links` |

A leading `unread, ` or `2 mentions, ` is dropped. Voice channels, forum
posts and the server's own pages are not listed. Channels inside a category
the user has folded are not on the page and are not found.

The [ConversationLocator](ConversationLocator.md) reads an opened
conversation from `[data-list-id="chat-messages"]`.

## Why

Discord's notification carries the message's id and nothing that leads to
its channel, and no address opens a message by its id alone. The page knows
every channel's address, but only for the server on screen, so the walk
visits each server once and the answers are remembered. Walking is done in
the hidden tab only: the user's own tab is read as it stands and never
clicked.

Measured 2026-11-23 on the user's own tab; the walk has not been timed on
an account with many large servers.
