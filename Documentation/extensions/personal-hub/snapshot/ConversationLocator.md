# ConversationLocator

`extensions/personal-hub/snapshot/ConversationLocator.js`

Works out where an activity item's conversation lives in the user's own
signed-in sessions: the persisted tab it came from, the session (partition)
only that tab is signed in to, and, when the Hub can tell, the address of
the conversation itself. Reading an item
([ConversationReader](ConversationReader.md)) and opening it
([ConversationOpener](ConversationOpener.md)) both start here, so both go
through the session that can show it.

## Methods

- `new ConversationLocator({ tabs, slack = null })`: `tabs` a
  [SessionTabs](../connections/SessionTabs.md), `slack` a
  [SlackSidebar](SlackSidebar.md) or `null`.
- `async locate(item)` -> `{ tab, partition, url, pane }`. `item` is a feed
  item with its `lastNotification`. `tab` is the persisted tab it came from
  or `null` (`tabFor`), `partition` its session or `undefined`
  (`partitionOf`), `url` the conversation's own address or `null`
  (`ownAddress`, else for a Slack item the address its tab's sidebar gives),
  and `pane` the selector of the conversation on that app's page or `null`
  (`PANES`).
- `tabFor(item)`: when the last notification recorded its session, the
  persisted tab of that partition (of the same app first); otherwise the
  only persisted tab of that app. Two tabs of the app with no recorded
  session would be a guess, so none is taken. A failed read of the tabs
  gives `null`.
- `static ownAddress(item, tab)` -> the address the item carries itself, or
  `null`:
  - `item.context.conversationUrl`, when it is an http(s) link (an
    automation said so);
  - the item's url (else its last notification's) when the notification
    came from an automation (host `automation`) or the app is `clickup`,
    whose notifications link the task;
  - for a Slack item keyed `channel:<id>`,
    `https://app.slack.com/client/<team>/<id>`, the team id being read from
    the Slack tab's address (else the item's url).
- `static partitionOf(item, tab)`: the last notification's partition, else
  the tab's, else `undefined`.
- `static shows(tab, url)`: whether a tab is already at an address: the
  same host and path, whatever query or fragment follows. `false` without a
  tab or when either address does not parse.

## Slack

A Slack notification names its channel or sender only. For a Slack item
with a tab and no address of its own, `_slackAddress` asks the sidebar for
the conversation named by the item's title. The title is read through
[NotificationClassifier](../inbox/NotificationClassifier.md)`.slackConversation`,
so an item still titled `New message in #general` is looked up as
`#general`. Without a tab or a sidebar reader there is no address.

`PANES` names the part of an app's page that holds the conversation, the
rest being navigation: `slack` is `.p-message_pane`. An app without an entry
is read whole.

## Why

A web notification's `url` is only where its tab happened to be when it
fired, so it counts as the conversation's address only for the apps and
automations where it is the item itself. What a notification does reliably
carry is the session it came through, and that session is the only one
signed in to the conversation, which is why the partition is part of the
answer even when no address is known.
