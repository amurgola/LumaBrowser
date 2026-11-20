# ConversationReader

`extensions/personal-hub/snapshot/ConversationReader.js`

Reads the conversation behind an activity item from the user's own signed-in
session, so a summary or a task can rest on more than a notification's
one-line snippet. Where the conversation lives comes from the
[ConversationLocator](ConversationLocator.md). Snapshots are kept per item
([SnapshotRepository](SnapshotRepository.md)) and reused until the item has
new activity. One read runs at a time.

## Two ways to read

Tried in this order:

| Scope | When | How |
|---|---|---|
| `conversation` | the item has an address of its own (the locator's `url`) | when the user's tab is already at that address it is read as it stands; otherwise a hidden tab in the same session opens it, the conversation is read as text, and the tab is closed |
| `tab` | otherwise, or when the first way read nothing | the signed-in tab the item came from is read as it stands, and only the part that mentions the item's subject or people is kept ([SnapshotExcerpt](SnapshotExcerpt.md)) |

The user's own tab is never navigated. When it is showing something else
there is nothing to keep, and the reader says so instead of guessing.

## Methods

- `new ConversationReader({ locator, browser, snapshots, sleep? })`:
  `locator` a ConversationLocator, `browser` the BrowserService (`null`
  outside the app), `snapshots` a SnapshotRepository, `sleep(ms)` a test
  seam.
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

## Reading

- `locator.locate(item)` gives the item's tab, its session, the
  conversation's address and the `pane`: the selector of the conversation
  on that app's page, or `null`.
- When the tab is already at the address
  (`ConversationLocator.shows(tab, url)`), `_readShown` reads the tab where
  it stands: the pane alone when the app has one, else the whole page. A
  persisted tab that was never shown since the app started has no size and
  may have drawn nothing; that reads as empty, and the next step does the
  reading.
- Otherwise, or when the shown tab read as empty, `_readAddress` opens the
  address in a [HiddenTab](HiddenTab.md) of the same session, with the pane
  as what to wait for, then gives the app `SETTLE_MS` = 2.5 s to draw and
  reads `_conversation(tabId, pane)`: the pane alone
  (`browser.getSource(tabId, { type: 'markdown', selector: pane })`), or the
  whole page (`{ type: 'markdown' }`) when the app has no pane or the pane
  read came back empty. The tab is always closed.
- What was read keeps its newest end (`SnapshotExcerpt.tail`).
- The user's tab, for the `tab` scope, is read whole with `getSource` and
  cut down with `SnapshotExcerpt.around` and the item's `needles`.
- A read that throws or comes back empty counts as nothing read.

## Wiring

Built in [PersonalHubExtension](../PersonalHubExtension.md) and handed to
[HubService](../HubService.md) (`snapshotThread`, and the conversation
attached to a task made from an item) and to
[ActivitySummarizer](../summary/ActivitySummarizer.md) (a card that may need
the user is written again with the conversations behind its asks). The same
locator serves the [ConversationOpener](ConversationOpener.md).

## Why

A notification carries one line. Whether a question was already answered,
or what exactly is being asked, is in the conversation, and the user is
already signed in to it: reading through their own session needs no API
key and sees exactly what they would see. A hidden tab in the same
partition is used when the item can be addressed, so the user's tab stays
where they left it. Reading only the conversation's pane keeps the app's
navigation (a sidebar of every channel) out of the text a summary is
written from.
