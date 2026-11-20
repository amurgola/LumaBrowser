# ConversationOpener

`extensions/personal-hub/snapshot/ConversationOpener.js`

Takes the user to an activity item. Only the session its notification came
from is signed in to it, so the item opens there: at the conversation's own
address in a new tab of that session when the Hub knows the address, else by
bringing the signed-in tab it came from to the front. An item with neither
opens its link in an ordinary tab.

## Methods

- `new ConversationOpener({ locator, tabs, browser })`: `locator` a
  [ConversationLocator](ConversationLocator.md), `tabs` a
  [SessionTabs](../connections/SessionTabs.md), `browser` the
  BrowserService (`null` outside the app).
- `async open(item)` -> `{ success: true, opened }` or `{ success: false,
  error }`. `item` is a feed item with its `lastNotification`. What happens
  follows from `locator.locate(item)`:

| `opened` | When | How |
|---|---|---|
| `conversation` | the item has an address and its tab is not already there | `browser.createTab(url, { kind: 'user', partition })`, a new tab in the item's session |
| `tab` | the tab is already at the address, or the item has no address but its tab is open | `tabs.show(tabId)` brings the signed-in tab to the front |
| `link` | no address and no tab, but the item (else its last notification) has an http(s) link | `browser.createTab(link, { kind: 'user', partition })` |

## Errors

- `The browser is not available.` (`NO_BROWSER`) without a browser that can
  create a tab.
- `There is nothing to open for this item.` (`NOTHING`) when there is no
  address, no tab and no link (a desktop notification, for one).
- A `tabs.show` that answers `success: false` is passed on as it is, and a
  thrown `createTab` becomes `{ success: false, error: <message> }`.

## Wiring

Built in [PersonalHubExtension](../PersonalHubExtension.md) over the same
locator as the reader and handed to [HubService](../HubService.md), whose
`openThread(threadId)` the activity widget's `Open` calls
([HubInboxWidget](../ui/widgets/HubInboxWidget.md)).

## Why

Each persisted tab keeps its own session, so a link opened in an ordinary
tab lands on a sign-in page, and the notification's own url is only where
the tab happened to be. Opening in the item's partition keeps the user
signed in, and a new tab leaves the persisted tab where they left it. When
no address is known, the right place is still the tab the item came from.
