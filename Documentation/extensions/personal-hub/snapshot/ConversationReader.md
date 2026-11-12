# ConversationReader

`extensions/personal-hub/snapshot/ConversationReader.js`

Reads the conversation behind an activity item from the user's own signed-in
session, so a summary or a task can rest on more than a notification's
one-line snippet. Snapshots are kept per item
([SnapshotRepository](SnapshotRepository.md)) and reused until the item has
new activity. One read runs at a time.

## Two ways to read

Tried in this order:

| Scope | When | How |
|---|---|---|
| `conversation` | the item has an address of its own (`conversationUrl`) | a hidden tab in the same session opens it, the page is read as text, and the tab is closed |
| `tab` | otherwise, or when the first way read nothing | the signed-in tab the item came from is read as it stands, and only the part that mentions the item's subject or people is kept ([SnapshotExcerpt](SnapshotExcerpt.md)) |

The user's own tab is never navigated. When it is showing something else
there is nothing to keep, and the reader says so instead of guessing.

## Methods

- `new ConversationReader({ tabs, browser, snapshots, sleep? })`: `tabs` a
  [SessionTabs](../connections/SessionTabs.md), `browser` the BrowserService
  (`null` outside the app), `snapshots` a SnapshotRepository, `sleep(ms)` a
  test seam.
- `available()`: whether there is a browser that can hand over a page's
  source.
- `stored(item)` -> the item's stored snapshot with `fresh` (its `sourceAt`
  equals the item's `lastAt`, so it still reflects the latest activity), or
  `null`.
- `forItems(items)` -> `{ <threadId>: snapshot }` for the items that have
  one.
- `read(item, { force = false })` -> a promise of `{ snapshot }` or
  `{ snapshot, reason }`. `item` is a feed item with its `lastNotification`.
  A fresh stored snapshot is returned as is unless `force`. A successful
  read is saved and answers `{ snapshot: { threadId, scope, url, text,
  sourceAt, takenAt, fresh: true } }`. When nothing was read the answer
  carries the reason and whatever older snapshot is stored (`null` when
  none): `Activity item not found.`, `The browser is not available.`, `The
  tab is showing something else, so there was nothing more to read.` or `No
  signed-in tab for this item is open.`. Calls queue behind one another, and
  a failed read does not hold up the next.
- `static conversationUrl(item, tab)` -> the address that shows this item's
  own conversation, or `null` when the Hub does not know one:
  - `item.context.conversationUrl`, when it is an http(s) link (an
    automation said so);
  - the item's url (else its last notification's) when the notification came
    from an automation (host `automation`) or the app is `clickup`, whose
    notifications link the task;
  - for a Slack item keyed `channel:<id>`,
    `https://app.slack.com/client/<team>/<id>`, the team id being read from
    the Slack tab's address (else the item's url).

## Reading

- The item's tab (`_tabFor`): when the last notification recorded its
  session, the persisted tab of that partition (of the same app first);
  otherwise the only persisted tab of that app. Two tabs of the app with no
  recorded session would be a guess, so none is taken.
- An address is opened with `browser.createTab(url, { partition, silent:
  true, kind: 'user', activate: false, title: 'Hub: reading a
  conversation' })` in the notification's partition (else the tab's). The
  hidden view is given a `VIEWPORT` of 1280 by 900, because a page laid out
  at no size renders nothing to read; the reader waits for the load (up to
  `LOAD_TIMEOUT_MS` = 20 s) and then `SETTLE_MS` = 2.5 s for the app to
  draw, reads `browser.getSource(tabId, { type: 'markdown' })`, keeps its
  newest end (`SnapshotExcerpt.tail`) and always closes the tab.
- The user's tab is read with the same `getSource` and cut down with
  `SnapshotExcerpt.around` and the item's `needles`.
- A read that throws or comes back empty counts as nothing read.

## Wiring

Built in [PersonalHubExtension](../PersonalHubExtension.md) and handed to
[HubService](../HubService.md) (`snapshotThread`, and the conversation
attached to a task made from an item) and to
[ActivitySummarizer](../summary/ActivitySummarizer.md) (a card that may need
the user is written again with the conversations behind its asks).

## Why

A notification carries one line. Whether a question was already answered,
or what exactly is being asked, is in the conversation, and the user is
already signed in to it: reading through their own session needs no API
key and sees exactly what they would see. A hidden tab in the same
partition is used when the item can be addressed, so the user's tab stays
where they left it. A web notification's `url` is only where its tab
happened to be when it fired, not the conversation, which is why it is
trusted only for the apps and automations where it is the item itself.
