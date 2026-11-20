# NotificationClassifier

`extensions/personal-hub/inbox/NotificationClassifier.js`

Works out which app an intercepted web notification came from and which
conversation it belongs to. The app comes from the host; one rule per app
reads the sender, thread key and thread title out of that app's title/body
layout, leaving out what the app only adds for show (`New message from`,
`2 new`). Never throws.

## Methods (static)

- `classify({ host?, url?, title, body, tag?, data?, tabTitle? })` returns
  `{ app, sender, threadKey, threadTitle, participants }` (`participants` is
  `[sender]` or `[]`). `host` falls back to the url's hostname.
- `appFor(host)`: the `HOSTS` suffix table (`slack.com` -> `slack`,
  `teams.microsoft.com` / `teams.cloud.microsoft` / `teams.live.com` ->
  `teams`, `mail.google.com` -> `gmail`, the four Outlook hosts -> `outlook`,
  `messages.google.com` -> `messages`, `app.clickup.com` -> `clickup`,
  `mail.proton.me` / `calendar.proton.me` -> `proton`, `discord.com`,
  `web.whatsapp.com`, `web.telegram.org`); sub-domains match; otherwise the
  host without `www.`, or `unknown` when empty.
- `hostOf(url, fallback)`.
- `slackConversation(title)` -> `{ name, direct }`: the conversation a
  Slack title names. `New message in #general` is `{ name: '#general',
  direct: false }` and `New message from Dana Reyes` is `{ name: 'Dana
  Reyes', direct: true }` (`SLACK_TITLE_RE`, which also reads `reply` and
  `mention` titles, case aside). A title in neither form is the name
  itself, direct unless it starts with `#`. `direct` means one person
  writing to the user.
- `firstLine(text)`: the first line of a text, trimmed.

## Rules (`RULES`, app -> function)

| App | Title | Body | Sender | Thread key | Thread title |
|---|---|---|---|---|---|
| slack | `New message in #channel`, `New message from Sender`, or (older clients) the channel or name alone | `Sender: text` in a channel, the text alone in a direct message | in a direct message the name the title gives; otherwise the leading name of the body (<= 40 chars, no newline), else `''` | `channel:<id>` from `data.channel_id` / `data.channel`, else the whole title | the name `slackConversation` gives (`#channel`, or the sender) |
| teams | `Sender in Chat` or the sender | text, maybe `Sender: text` | the part before ` in `, else the leading name, else the title | the chat name or the title | the chat name or the title |
| gmail, outlook | sender | `Subject\nSnippet` | the title | the subject (first line), else the sender | the subject, else the sender |
| proton | `New email received` | `From: Sender - Subject` | the part between `From:` and the first ` - ` | the subject's first line, else the sender | the subject's first line, else the sender |
| messages, whatsapp, telegram | contact or group, maybe followed by a count (`Dana Reyes • 2 new`) | text | the title without the count | the title without the count | the title without the count |
| clickup | `Actor commented on Task` or the task | text | the actor when the title matches the action pattern | the tag, else the task name | the task name |
| default | | | `''` | the tag, else the title | the title |

Every key goes through [ThreadKey](ThreadKey.md). An empty result falls back
to the tag, title, body, then the app name, so a thread key is never empty.

Notes on the rules:

- Slack's key stays the whole title (`new message in #general`) however the
  title is read, so an item keeps its history when the reading of titles
  changes. A channel message with no `Sender: ` lead (`[no preview
  available]`) has no sender, never the channel as one.
- Proton names nobody in its title, so sender and subject come from the
  body (`PROTON_BODY_RE`; the subject may be empty). A body in any other
  layout reads as plain mail (title is the sender).
- The count Google Messages appends (`NEW_COUNT_RE`) is not part of who
  wrote, so `Dana Reyes • 2 new` and `Dana Reyes` are one conversation.

## Why a table

Each app's notification layout is a fact about that site, not logic; keeping
them as data makes a new app one row plus one test sample. The sender a
rule names becomes a contact and decides where a direct item is filed, so a
rule that takes a label (`New email received`, `New message from Dana
Reyes`) for a person does lasting harm. When a rule changes how a sender or
a title is read, the stored feed is read again once
([InboxService](InboxService.md)`.reclassify`,
[PersonalHubExtension](../PersonalHubExtension.md)`.FEED_RULES`).
