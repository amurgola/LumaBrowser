# NotificationClassifier

`extensions/personal-hub/inbox/NotificationClassifier.js`

Works out which app an intercepted web notification came from and which
conversation it belongs to. The app comes from the host; one rule per app
reads the sender, thread key and thread title out of that app's title/body
layout. Never throws.

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

## Rules (`RULES`, app -> function)

| App | Title | Body | Sender | Thread key |
|---|---|---|---|---|
| slack | channel or DM name | `Sender: text` | the leading name (<= 40 chars, no newline), else the title | `channel:<id>` from `data.channel_id` / `data.channel`, else the title |
| teams | `Sender in Chat` or the sender | text, maybe `Sender: text` | the part before ` in `, else the leading name, else the title | the chat name or the title |
| gmail, outlook, proton | sender | `Subject\nSnippet` | the title | the subject (first line), else the sender |
| messages, whatsapp, telegram | contact or group | text | the title | the title |
| clickup | `Actor commented on Task` or the task | text | the actor when the title matches the action pattern | the tag, else the task name |
| default | | | `''` | the tag, else the title |

Every key goes through [ThreadKey](ThreadKey.md). An empty result falls back
to the tag, title, body, then the app name, so a thread key is never empty.

## Why a table

Each app's notification layout is a fact about that site, not logic; keeping
them as data makes a new app one row plus one test sample.
