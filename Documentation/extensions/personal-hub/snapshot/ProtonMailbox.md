# ProtonMailbox

`extensions/personal-hub/snapshot/ProtonMailbox.js`

Proton Mail as the Hub reads it: where one mail is found in the mailbox its
notification came from, how it is opened there, and how the opened mail
reads as text. Used by [MailboxReader](MailboxReader.md).

## Methods (static)

- `ACCOUNT`: the signed-in account in a mailbox address (`/u/2/`).
- `LIST` = `[data-testid^="message-item:"]`: a row of the mail list.
  `BODY` = `iframe[data-testid="content-iframe"]`: the frame an opened
  mail's body lives in.
- `searchAddress(item, tab)` -> `https://mail.proton.me/u/<n>/all-mail#keyword=<subject>`,
  or `null`. The account comes from the notification's address, else from
  the persisted tab's; the keyword is the item's title (the subject), else
  the sender. `null` when the account is not known or there is nothing to
  search for.
- `async open(page, item)` -> whether the mail is open. When the
  notification carried a message id (its `tag`), the row with that id
  (`[data-element-id="<id>"]`) is waited for first, since the list may
  still be filling. Then `openProtonMail` runs in the page: it clicks the
  row with the id, else the newest row whose subject (the row's
  `message-item:<subject>` test id, trimmed, any case) is the item's
  title. A click is followed by a wait for `BODY`.
- `READ_JS`: `readProtonMail` as a snippet. In the page it answers the
  opened mail as text, or `''` when no message is open:

  ```
  Subject: S-patch connection (3 earlier messages in this conversation not shown)

  From: Matt Sullivan<msullivan@example.com>
  To: Casey McNeil,Andrew Murgola
  Sent: Monday, November 23rd, 2026 at 11:48 AM
  Hey team, ...
  ```

  Each message view with a body is one block, newest first: the sender (the
  last line of `recipients:sender`), the line after `To` and the line with
  a clock time in the expanded header, then the body's non-empty lines. The
  body is read from the frame's own document. Folded messages of a long
  conversation have no body frame and are only counted.

## What was measured (2026-11-23)

- The notification's `tag` is the message id: the same value is the
  `data-element-id` of the mail's row.
- An address made from it does not open the mail. `all-mail/<id>` and
  `all-sent/<id>`, with and without a `#keyword`, all answered
  `Conversation does not exist`: with conversation grouping on, Proton
  takes the id in the address for a conversation's.
- A search (`#keyword=`) lists single messages, each row carrying its
  message id. Clicking the row opens the conversation at
  `all-mail/<conversation id>/<message id>` with that message unfolded.
- The page builds all of this with no viewport at all, so the read does not
  depend on the tab's size.
