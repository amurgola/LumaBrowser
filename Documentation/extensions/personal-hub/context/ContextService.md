# ContextService

`extensions/personal-hub/context/ContextService.js`

The user's contexts: the few companies or areas of life everything in the Hub
belongs to. The user names them once and says what belongs to each (a
conversation by name, mail by a word in its subject, a signed-in tab, a
mail or site domain, part of a link, a whole app, a calendar, a task
tracker), and may say which context a
person belongs to; the Hub then files every activity item under one, so
summaries ([ActivitySummarizer](../summary/ActivitySummarizer.md)) and the
focus view group by what the work is for instead of by which app raised it.
Emits `context.changed` after a save.

## Rules

A rule is `{ kind, value }`. `KINDS`, most specific first:

| Kind | Matches |
|---|---|
| `conversation` | a channel or chat by its name (`#acme-project`, `Dana Reyes`), whatever tab it is in; the item's title, compared in lower case without a leading `#` |
| `subject` | a word or phrase in the subject of a mail (`Acme`, `purchase order`), whoever sent it and whichever mailbox it arrived in; whole words, case and punctuation aside, so `Acme` is in `Re: ACME/Q3` and not in `Acmeville`. Only a mail has a subject: a chat's title is the name of its conversation |
| `url` | part of the link a notification carries (a Slack team id, a ClickUp workspace id); a case-insensitive "contains" |
| `partition` | the session of the signed-in tab that raised it; exact |
| `domain` | the site a notification came from, or the mail domain of who sent it; `mail.acme.com` belongs to `acme.com`, a leading `www.` is ignored |
| `app` | every item of one app (`slack`, `gmail`, ...); exact |
| `calendar` | a calendar source id |
| `tasks` | a task source id |

`calendar` and `tasks` rules assign a whole source. The others file an
activity item, in the order below.

## How an item is filed

`resolve` takes the first of these that names a context:

1. `named`: a context id or name the item carries itself (an automation
   said so).
2. What the item is about (`TOPIC_KINDS`): a `conversation` rule, then a
   `subject` rule.
3. `home`: the context of the person the item is directly from. It counts
   only when that context still exists.
4. Where it came from (`PLACE_KINDS`): a `url` rule, then `partition`, then
   `domain`, then `app`. Every context is asked for one kind before any is
   asked for the next, and within one kind the first context in display
   order wins.

`home` is worked out by `forItem` (`_home`): only with a people memory, a
sender, and an item that is direct
([ActivityKind](../inbox/ActivityKind.md)`.isDirect`: a mail, or a
conversation named after whoever sent it). In a room many share the room
decides, so the person does not. The sender is looked up with
`people.find({ app, sender })`, which answers only when the sender can be
one contact, and that contact's context is `contextOfContact`.

## Methods

- `new ContextService({ contexts, emit?, people = null })`: `contexts` a
  [ContextRepository](ContextRepository.md), `emit(type, payload)` the
  renderer push, `people` the people memory
  ([ContactService](../contacts/ContactService.md); only `find` is used) or
  `null`, without which no person decides a context.
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
  is `{ conversation?, subject?, url?, partition?, host?, sender?, app?,
  named?, home? }`, read in the order above.
- `forItem(item, contexts?)`: the context of a feed item (a thread with its
  `lastNotification`). The conversation is the item's title, and so is the
  subject when the item is a mail
  ([ActivityKind](../inbox/ActivityKind.md)`.of`); the url is the
  last notification's, else the item's; the partition and host are the last
  notification's; the sender is the last notification's, else the
  participants; `named` is the item's `context.hubContext` or
  `context.company`; `home` is looked up for the last notification's
  sender, else the item's only participant.
- `forSource(kind, sourceId, contexts?)`: the context a calendar (`calendar`)
  or task (`tasks`) source was assigned to, or `null`.
- `contextOfContact(contact, contexts?)` -> a context id or `null`: the
  context a contact (`{ contextId, role }`) belongs to. The one the user
  picked for it when it still exists, else the only context whose name
  appears as a word in the contact's `role` (`Acme employee`); none when
  the role names no context or more than one.

## Events

`context.changed` `{ reason: 'saved' }`.

## Why

The user works across several companies at once, and the same app (Slack,
Gmail, ClickUp) serves more than one of them, so the app alone cannot say
what an item is for. The session of the tab, the workspace id in the link
and the sender's domain can, which is why those rules outrank the app. A
tab alone is still not enough where a workspace is shared: one channel of a
company's Slack can be about another company, which the conversation rule
settles, one mailbox can carry mail about two companies, which the subject
rule settles (it sits above the person, so a colleague from one company
writing about the other is filed by what the mail is about), and a person from one company can write through a mailbox or a
workspace that belongs to another, which the person's own context settles
for what they send directly. The context of an item is worked out when it
is read, never stored, so changing the rules refiles everything at once.
