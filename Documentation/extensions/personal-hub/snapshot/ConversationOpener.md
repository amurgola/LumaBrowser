# ConversationOpener

`extensions/personal-hub/snapshot/ConversationOpener.js`

Takes the user to an activity item. Only the session its notification came
from is signed in to it, so the item opens there: at the conversation's own
address in a new tab of that session when the Hub knows the address; a
mail, which has no address, is found in its mailbox and opened in a new tab
of that session; else the signed-in tab it came from is brought to the
front. An item with none of these opens its link in an ordinary tab.

## Methods

- `new ConversationOpener({ locator, tabs, browser, mailbox? })`: `locator` a
  [ConversationLocator](ConversationLocator.md), `tabs` a
  [SessionTabs](../connections/SessionTabs.md), `browser` the
  BrowserService (`null` outside the app), `mailbox` a
  [MailboxReader](MailboxReader.md) or `null` (without it a mail only
  brings its tab to the front).
- `async open(item)` -> `{ success: true, opened }` or `{ success: false,
  error }`. `item` is a feed item with its `lastNotification`. What happens
  follows from `locator.locate(item)`:

| `opened` | When | How |
|---|---|---|
| `conversation` | the item has an address and its tab is not already there | `browser.createTab(url, { kind: 'user', partition })`, a new tab in the item's session |
| `mail` | the item has no address and is a mail of a mailbox the Hub knows (Proton, Gmail) | `mailbox.show(item, { tab, partition })`: a new tab of the item's session searches the mailbox for the mail and opens it; the tab stays on the mail, or on the search when the mail is not there |
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

## Mail (2026-11-23)

The user reported that Open on some items of a summary card did not take
them to the conversation. Those were mails: with no address, Open only
brought the mail tab forward wherever it stood (the inbox). Open is the
user asking, so it opens the mail whatever the summaries setting says
about what the Hub may read on its own.

Run in the installed app the same day through `hub_open_thread`: a Proton
mail opened on the message itself in 3.5 s (`opened: 'mail'`), a Slack
direct message and a Discord channel each in a tab of their own
(`opened: 'conversation'`). `node tmp/hub-open-check.js <threadId>`
(git-ignored) does this for one item in the running app, says where the new
tab landed and closes it again.

## Why

Each persisted tab keeps its own session, so a link opened in an ordinary
tab lands on a sign-in page, and the notification's own url is only where
the tab happened to be. Opening in the item's partition keeps the user
signed in, and a new tab leaves the persisted tab where they left it. When
no address is known, the right place is still the tab the item came from.
