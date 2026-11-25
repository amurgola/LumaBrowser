# ConversationList

`extensions/personal-hub/snapshot/ConversationList.js`

Finds the address of a conversation by its name, for an app whose
notifications name a channel or a person but carry no address, while the
app's own conversation list has both. The base of
[SlackSidebar](SlackSidebar.md), [TeamsSidebar](TeamsSidebar.md) and
[DiscordSidebar](DiscordSidebar.md); each says how its app's list reads.

## Methods

- `new ConversationList({ tabs, browser?, db? })` (through a subclass):
  `tabs` a [SessionTabs](../connections/SessionTabs.md); `browser` the
  BrowserService (without it no hidden tab is opened); `db` the extension's
  DatabaseService (without it nothing is remembered).
- `async addressOf(tab, name)` -> the conversation's address, or `null`.
  `tab` is the app's persisted tab (`{ tabId, url, partition }`). The
  workspace comes from `spaceOf(tab)`; `null` there, or an empty name, ends
  it. The id is then looked for in three places, in order: what earlier
  lists said (the setting `KNOWN_KEY`, `{ space: { name: id } }`); the rows
  of the user's own tab (`ROWS_JS` through `tabs.run`); the rows of
  `home(space)` opened in a [HiddenTab](HiddenTab.md) of the tab's session
  once `READY` shows (`SCAN_JS` when the app has one, else `ROWS_JS`).
  Every conversation a list names is remembered, not only the one asked
  for.
- `static find(rows, name)` -> the id of the conversation called `name`, or
  `null`, among `conversations(rows)`, names compared through `key`.
- `static conversations(rows)`: the rows that are conversations: an id that
  matches `CONVERSATION_ID` and a name. A list also holds headings and the
  app's own pages.
- `static key(name)`: lower case, trimmed, without a leading `#`.

## What a subclass gives (statics)

`KNOWN_KEY`, `ROWS_JS` (a snippet answering `[{ id, name }]`), optionally
`SCAN_JS` (the snippet for the hidden tab, when more can be listed there
than a tab shows as it stands), `READY`, `CONVERSATION_ID`, `spaceOf(tab)`
(the workspace, `null` when the tab is not on the app), `home(space)` and
`address(space, id)`.

## Why

Slack came first; Teams and Discord work the same way (2026-11-23), so what
they share lives here once: read the user's tab without moving it, fall back
to a hidden tab of the same session, remember what was listed. A
conversation no list shows is not found, and the caller falls back to the
tab as it stands.
