# GmailMailbox

`extensions/personal-hub/snapshot/GmailMailbox.js`

Gmail as the Hub reads it: where one mail is found in the mailbox its
notification came from, how it is opened there, and how the opened mail
reads as text. Used by [MailboxReader](MailboxReader.md).

## Methods (static)

- `ACCOUNT`: the signed-in account in a mailbox address (`/mail/u/0/`).
- `LIST` = `div[role="main"] tr.zA`: a row of the mail list. `BODY` =
  `div[role="main"] .a3s`: the body of an opened message.
- `searchAddress(item, tab)` ->
  `https://mail.google.com/mail/u/<n>/#search/<query>`, or `null`. The
  account comes from the notification's address, else from the persisted
  tab's. The query is `subject:("<the item's title>")`, or
  `from:("<sender>")` when the item has no subject of its own (its title is
  the sender); double quotes inside either are dropped. `null` when the
  account is not known or there is nothing to search for.
- `async open(page)` -> whether the mail is open. `openGmailThread` runs in
  the page: the first row found (the newest) carries its thread's id
  (`data-legacy-thread-id`), and the page is sent to `#all/<id>`, which
  opens that thread. Followed by a wait for `BODY`.
- `READ_JS`: `readGmailThread` as a snippet. In the page it answers the
  opened thread as text, or `''` when no message is open: `Subject: <h2.hP>`
  (with `(N earlier messages in this thread not shown)` when Gmail folded
  some, `.kv` and `.kQ`), then each opened message (`.adn`) newest first as
  `From: Name <address>` (`.gD`), `Sent: <.g3>` and the body's non-empty
  lines.

## What was measured (2026-11-23)

A Gmail notification's tag is `en_<account address>` and its address is the
inbox, so nothing in it names the mail. A subject search in the user's own
tab listed the mail, the row carried the thread id, and `#all/<id>` opened
the thread with its newest message unfolded. Gmail's class names (`zA`,
`a3s`, `adn`, `gD`, `hP`) have been stable for years but are not an
interface; when a read comes back empty, look here first.
