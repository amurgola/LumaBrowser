# ContextService

`extensions/personal-hub/context/ContextService.js`

The user's contexts: the few companies or areas of life everything in the Hub
belongs to. The user names them once and says what belongs to each (a
signed-in tab, a mail or site domain, part of a link, a whole app, a
calendar, a task tracker); the Hub then files every activity item under one,
so summaries ([ActivitySummarizer](../summary/ActivitySummarizer.md)) and the
focus view group by what the work is for instead of by which app raised it.
Emits `context.changed` after a save.

## Rules

A rule is `{ kind, value }`. `KINDS`, most specific first:

| Kind | Matches |
|---|---|
| `url` | part of the link a notification carries (a Slack team id, a ClickUp workspace id); a case-insensitive "contains" |
| `partition` | the session of the signed-in tab that raised it; exact |
| `domain` | the site a notification came from, or the mail domain of who sent it; `mail.acme.com` belongs to `acme.com`, a leading `www.` is ignored |
| `app` | every item of one app (`slack`, `gmail`, ...); exact |
| `calendar` | a calendar source id |
| `tasks` | a task source id |

`ITEM_KINDS` (`url`, `partition`, `domain`, `app`) are the ones tried for an
activity item, in that order: every context is asked for a `url` match
before any is asked for a `partition` match, and so on, so the precedence is
url, then partition, then domain, then app, and within one kind the first
context in display order wins. `calendar` and `tasks` rules assign a whole
source.

## Methods

- `new ContextService({ contexts, emit? })`: `contexts` a
  [ContextRepository](ContextRepository.md), `emit(type, payload)` the
  renderer push.
- `list()` -> `[{ id, name, color, sortOrder, rules }]` in display order.
- `save(contexts)`: replaces the set with `[{ id?, name, color?, rules }]` in
  display order and returns the saved list. A missing id is created (prefix
  `ctx`), `sortOrder` is the position, a colour that is not a hex value
  falls back to `PALETTE` by position. Domain values lose a pasted scheme,
  path, `www.` or anything up to an `@`; other values are only trimmed.
  Empty rules are dropped, and a rule listed by two contexts stays with the
  first. Throws `Send the contexts as a list.`, `Every context needs a
  name.`, `Two contexts are named "<name>".` (case aside) and `Unknown rule
  kind "<kind>".`.
- `resolve(facts, contexts = this.list())` -> a context id or `null`. `facts`
  is `{ url?, partition?, host?, sender?, app?, named? }`; `named` is a
  context id or name the item carries itself (an automation said so) and
  wins over every rule.
- `forItem(item, contexts?)`: the context of a feed item (a thread with its
  `lastNotification`). The url is the last notification's, else the item's;
  the partition and host are the last notification's; the sender is the last
  notification's, else the participants; `named` is the item's
  `context.hubContext` or `context.company`.
- `forSource(kind, sourceId, contexts?)`: the context a calendar (`calendar`)
  or task (`tasks`) source was assigned to, or `null`.

## Events

`context.changed` `{ reason: 'saved' }`.

## Why

The user works across several companies at once, and the same app (Slack,
Gmail, ClickUp) serves more than one of them, so the app alone cannot say
what an item is for. The session of the tab, the workspace id in the link
and the sender's domain can, which is why those rules outrank the app. The
context of an item is worked out when it is read, never stored, so changing
the rules refiles everything at once.
