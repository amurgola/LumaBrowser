# MailboxReader

`extensions/personal-hub/snapshot/MailboxReader.js`

Opens the mail behind an activity item in the mailbox its notification came
from and reads it: a hidden tab of the same signed-in session searches the
mailbox for the mail, opens it and takes its text, and is closed again. The
user's own mail tab is never moved. Opening a mail marks it as read, as it
would for the user, so the Hub does this only where the user allowed it
(see [ConversationReader](ConversationReader.md)).

## Methods

- `MAILBOXES` (static): app -> what knows that app's mailbox, `proton`
  ([ProtonMailbox](ProtonMailbox.md)) and `gmail`
  ([GmailMailbox](GmailMailbox.md)). A mailbox has `LIST` (what the page
  shows once the search has listed its mails), `READ_JS` (the opened mail as
  text), `searchAddress(item, tab)` and `async open(page, item)`.
- `new MailboxReader({ browser, tabs, sleep? })`: `browser` the
  BrowserService, `tabs` a
  [SessionTabs](../connections/SessionTabs.md) (runs a snippet inside a
  tab), `sleep(ms)` a test seam.
- `handles(item)`: whether the Hub knows how to open this item's mail.
- `async read(item, { tab?, partition })` -> `{ url, text }`, or `null`.
  The mailbox's `searchAddress` is opened in a
  [HiddenTab](HiddenTab.md) of `partition`, waiting for `LIST`. The mailbox
  then opens the mail (`open`), the page gets `SETTLE_MS` = 1.5 s to draw
  the body, and `READ_JS` is run. `null` when the app has no mailbox here,
  the account is not known, the mail was not found, its body never
  appeared, or it read as empty. The tab is closed in every case.
- `async show(item, { tab?, partition })` -> whether a tab was opened. The
  same search and the same `open`, in a tab the user sees
  (`browser.createTab(url, { kind: 'user', partition })`), which is left
  open: on the mail, or on the search when the list never showed or the
  mail was not in it. `false` when the app has no mailbox here, the
  account is not known, or no tab could be made. Used by
  [ConversationOpener](ConversationOpener.md).
- `_page(tabId)`: what a mailbox drives its page with, `run(code)` (the
  snippet's value) and `waitFor(selector)` (whether it appeared within
  `OPEN_TIMEOUT_MS` = 15 s).

## Why

A mail notification is a sender and a subject. Whether "S-patch connection"
is a status note or a question to the user is in the mail, and the user is
already signed in to it. A mail has no address a notification could carry
(Gmail sends none, Proton refuses the one its id would make), so each
mailbox is searched for the subject, the way the user would find it. A
hidden twin of the session does it, so the user's own mail tab stays where
they left it.

Measured on 2026-11-23 in the user's own Proton and Gmail tabs, and through
the installed app's hidden tab.
