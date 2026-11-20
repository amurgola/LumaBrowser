# SlackSidebar

`extensions/personal-hub/snapshot/SlackSidebar.js`

Finds the address of a Slack conversation by its name. A Slack notification
names its channel or its sender but carries no address, while the
conversation list in the sidebar of a signed-in Slack page has both: each
row is the name with the conversation's id. The list is read from the
user's own Slack tab where it stands; a tab that was never shown since the
app started has no size and lists nothing, so the list is then read in a
hidden tab of the same session. What a list said is remembered, so each
conversation is looked up once.

## Methods

- `new SlackSidebar({ tabs, browser?, db? })`: `tabs` a
  [SessionTabs](../connections/SessionTabs.md); `browser` the BrowserService
  (without it no hidden tab is opened); `db` the extension's
  DatabaseService (without it nothing is remembered).
- `async addressOf(tab, name)` -> `https://app.slack.com/client/<team>/<id>`
  or `null`. `tab` is the persisted Slack tab (`{ tabId, url, partition }`),
  `name` a channel (`#general`) or a person's name. The team id is read from
  the tab's address (`TEAM`, the part after `/client/`). The id is looked
  for in three places, in order: what earlier lists said (the setting
  `slack.conversations`, `{ team: { name: id } }`); the rows of the user's
  own tab (`ROWS_JS` through `tabs.run`); the rows of the workspace opened
  in a [HiddenTab](HiddenTab.md) of the tab's session, once its sidebar has
  drawn (`READY`). Every conversation a list names is remembered, not only
  the one asked for. `null` when the tab's address has no team, the name is
  empty, or no list names the conversation.
- `static find(rows, name)` -> the id of the conversation called `name`, or
  `null`. `rows` is `[{ id, name }]` as `ROWS_JS` gives them. Names are
  compared in lower case without a leading `#`, so `#General` and `general`
  are one channel. Only rows whose id reads as a conversation
  (`CONVERSATION_ID`: `C`, `D` or `G` followed by six or more capitals or
  digits) can match, which leaves out the sidebar's pages and section
  headings.

## The page script

`ROWS_JS` returns every `.p-channel_sidebar__static_list__item` that has an
id as `{ id, name }`: the row's element id is the conversation's id, and the
name is the first child of `.p-channel_sidebar__name` (a `guest` label may
follow it), else that element's own text.

## Wiring

Built in [PersonalHubExtension](../PersonalHubExtension.md) and handed to
the [ConversationLocator](ConversationLocator.md), which asks it for the
address of a Slack item that carries none.

## Why

Slack's web notification has no channel id and its `url` is only where the
tab happened to be. The page itself knows the id of every conversation it
lists, and reading its sidebar needs no token and changes nothing in the
tab. Slack draws only the rows that fit its window, and a persisted tab is
restored hidden with no size, so after a restart the user's tab lists
nothing until it has been shown once: that is what the hidden tab is for,
and remembering the answers keeps it to one extra page load per workspace.
A conversation no list shows (a collapsed section, a channel the user is
not in) is not found, and the caller falls back to the tab as it stands.
