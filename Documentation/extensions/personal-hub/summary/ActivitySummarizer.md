# ActivitySummarizer

`extensions/personal-hub/summary/ActivitySummarizer.js`

The distilled view of the activity feed: recent items grouped by context
([ContextService](../context/ContextService.md)), then "Other", each group
one card that says what is going on and whether anything is being asked of
the user. A card is written by the model the user chose for the Hub's
summariser slot (`SLOT` = `personal-hub.summarizer`), and only written again
when its own items changed, so a new notification updates one card and
leaves the rest alone. Each item also carries the coming meetings that bear
on it ([CalendarEvidence](CalendarEvidence.md): the same subject, or a
meeting with just the person who wrote), so booking a meeting rewrites the
card that was asking for one. Without a model, or with summaries switched off,
every card still shows, filled in by plain rules. When a card may need the
user, the conversations behind what is asked are read from the user's own
tabs and the card is written once more with them. The model only proposes:
nothing here creates a task or dismisses anything. Emits `summary.changed`
as cards are written.

## Methods

- `new ActivitySummarizer({ inbox, contexts, summaries, db, llm?, reader?, people?, meetings?, emit?, now?, debounceMs = 15000 })`:
  `inbox` an [InboxService](../inbox/InboxService.md), `contexts` a
  ContextService, `summaries` a [SummaryRepository](SummaryRepository.md),
  `db` the extension's DatabaseService (the on/off setting), `llm` the app's
  [LLMService](../../../core/llm-service/LLMService.md) or `null`, `reader`
  a [ConversationReader](../snapshot/ConversationReader.md) or `null` (reads
  the conversation behind what may need the user), `people` a
  [ContactService](../contacts/ContactService.md) or `null` (names
  participants as known contacts), `meetings` a
  [CalendarEvidence](CalendarEvidence.md) or `null` (the coming meetings
  that bear on an item; without one no item has any).
- `status()` -> `{ enabled, available, provider, model, running, lastRunAt,
  lastError }`: `available` is whether the app has an LLM service at all;
  `provider` and `model` are what the slot resolves to right now (the user's
  pick, else the active provider's; `null` when unknown).
- `readsSources()`, `setReadsSources(on)`: the setting `summary.sources`
  (`SOURCES_KEY`, off by default): the model may ask for an item to be
  opened and read at its source, and the Hub may open a mail to do it.
  Setting it emits `summary.changed`; switching it on while summaries are
  on writes every card again, so the model gets to ask about what is
  there now. Returns `status()`, which carries it as `sources`.
- `enabled()`, `setEnabled(enabled)`: the setting `summary.enabled` (off by
  default). Switching it emits `summary.changed`, and switching it on
  schedules a pass at once. Returns `status()`.
- `models()` -> `{ models: [{ value, label, unavailable? }], chosen }`: what the model
  picker shows. Every model the LLM service lists
  (`getAllAvailableModels`), each `value` as `<providerId>::<modelId>`;
  `chosen` is the slot's current model in the same form
  (`getSlotConfig(SLOT)`), or `''` when nothing resolves. A model picked for
  the Hub (`explicit`) that nothing offers any more is still listed, with
  `unavailable: true` and the label `Unavailable: <model>`
  (`UNAVAILABLE_PREFIX`). Without an LLM service it answers
  `{ models: [], chosen: '' }`.
- `setModel(value)`: `value` is `<provider>::<model>`
  (`setSlotConfig(SLOT, provider, model)`), or `''` to go back to the app's
  active provider (`clearSlotConfig(SLOT)`). Emits `summary.changed` and
  returns `status()`. Throws `No language model service is available to the
  Hub.` without one.
- `cards()` -> `[{ key, contextId, name, color, count, lastAt, items,
  headline, summary, needsYou, reason, asks, source, stale, updatedAt,
  error }]`, contexts in the user's order and "Other" last; a context with
  no recent activity has no card. Each of a card's `items` carries
  `contextId` and `meetings` (`[{ id, title, startsAt, endsAt, allDay,
  attendees, organizer }]`, empty when none bears on it). `source` is `ai`
  when a stored summary
  exists, else `rules`; `stale` says the items changed since the AI text was
  written; `asks` (`[{ threadId, what }]`) naming an item that has since
  left the card are dropped; `error` is the last failed attempt, kept beside
  the last good text.
- `schedule(delayMs = debounceMs)`: summarise soon, once, however many
  changes arrive meanwhile. Does nothing when summaries are off or there is
  no LLM service.
- `stop()`: clears the pending timer.
- `run({ force = false })` -> `{ written, failed, skipped }`: writes every
  card whose signature differs from the stored one (all of them with
  `force`), one model call per card, or two for a card that was deepened
  (see Writing a card). A second caller joins the running pass
  and one more pass follows it, so nothing that arrived mid-run is missed.
  Throws `No language model service is available to the Hub.` without one.
  It runs whatever the on/off setting says, which is what the settings
  page's `Summarise now` relies on.

## Grouping

- Items: the active feed of the last `WINDOW_DAYS` = 3 days, at most
  `MAX_ITEMS` = 300, each filed by `ContextService.forItem`. Unfiled items
  share the key `other`, named `Other`, or `Everything` while the user has
  no contexts yet.
- Meetings: one `meetings.forItems(items)` call over all of those items
  gives each its coming meetings, attached as `item.meetings`.
- Signature: a sha1 over the card's name and, for its newest
  `MAX_ITEMS_PER_CARD` = 25 items, each one's id, last activity time, count
  and summary, followed for an item with meetings by each meeting's id and
  start (`_booked`). An item without a meeting adds nothing, so a card with
  no meetings keeps the signature it had; a meeting booked, moved or
  dropped changes the signature and the card is written again. Those same
  25 items are what the model is sent.
- Each pass first drops the stored summaries of contexts that no longer have
  any activity or no longer exist.
- Rule cards (no stored summary): the headline is the item count, the
  summary the newest `RULE_TITLES` = 3 subjects and `and N more`, and
  `needsYou` only for what an automation already marked high or urgent, with
  those items as the asks.

## Writing a card

- `_write(group)` asks the model once (`_ask`). A failed first answer stores
  the error on the row and keeps the previous text and signature, so the
  card is tried again on the next pass.
- `_ask(group, items)` -> `{ summary }` or `{ error }`: one question about
  one card, `llm.sendCompletion(SLOT, messages, { temperature: 0.2,
  max_tokens: MAX_TOKENS, timeout: TIMEOUT_MS, label: 'Hub summary:
  <name>' })` (`MAX_TOKENS` = 3000, `TIMEOUT_MS` = 300000; nothing is said
  about thinking, see "Room to think" below) with
  [SummaryPrompt](SummaryPrompt.md)`.messages` over the enriched items and
  `who: _who(items)`, the reply read through ResponseText and `SummaryPrompt.parse`. A thrown call,
  a refused reply (`The model did not answer.`) or one that does not parse
  (`The model did not answer in the expected form.`) is the error.
- `_enrich(items)`: the items as the prompt wants them. Each gets `people`
  (`_names`), `earlier` (`_earlier`) and `snapshot`: the conversation text
  when the reader holds a
  snapshot of the item's latest activity (its `sourceAt` equals the item's
  `lastAt`), else empty, so an outdated conversation is never sent. The
  item's `meetings` pass through as they are, and the prompt lists them
  under the item.
- `_earlier(item)` -> `[{ at, sender, text, seen }]`, oldest first: what reached
  the user in the item before its newest message, read from the feed's own
  log (`inbox.getThread`). Only notifications inside the cards' window
  (`_windowStart`, `WINDOW_DAYS` back), the newest
  `SummaryPrompt.MAX_EARLIER` of them, each one's body or else its title.
  One that says exactly what the newest says is left out: a site raising a
  notification again, or a mail notice that is the same sender and subject
  each time. `seen` is true for a message that arrived at or before the
  item's `dismissedAt` ([InboxService](../inbox/InboxService.md)): the
  user dismissed the item after it, so the prompt lists it as already
  seen. See "What an item knows" and "After a dismissal" below.
- `_names(item)`: each participant looked up as a contact (`_contact`). A
  known one is named as the contact, with `(also on slack, gmail)` listing
  the other apps that person appears in; an unknown one, or any when there
  is no contact service, stays as it came.
- `_who(items)` -> `[{ name, about }]`: what the user recorded about the
  people in these items, each contact once, only those whose `about` is
  not empty.
- `_contact(item, name)`: the contact a participant is known as
  (`people.lookup({ app, sender, contextId })`), or `null` without a
  contact service or when the lookup throws.
- `_worthReading(items, summary, more)` (static) picks what is read at its
  source after the first answer: when the card may need the user
  (`needsYou`), the items its asks name, or the newest item when it named
  none; then the items the model asked to see (`more`, only when
  `readsSources()`; the first question is then asked with `askMore` and
  its reply read with `SummaryPrompt.more`). Each item once, at most
  `DEEP_PER_CARD` = 3.
- `_deepen(targets)` reads them through the reader, skipping any that
  already has a fresh snapshot. It answers whether anything new was
  read; without a reader or a browser it reads nothing. A source that
  cannot be read leaves the card as it is.
- Only when something new was read is the model asked once more, now with
  those conversations in the prompt. A usable second answer replaces the
  first; an unusable one (an error, a reply that does not parse) is dropped
  and the first stands.
- The stored row carries the group's signature, so a deepened card is not
  written again until its items change.
- The signature is made from the context's name and its items, not from
  what is recorded about their people. A profile edited later reaches a card's text at the
  card's next rewrite (when its items change, or with `force`).

## Events

`summary.changed` with `{ reason: 'settings' }` after `setEnabled` and
`setModel`,
`{ key, reason: 'written' | 'failed' }` per card and `{ reason: 'run' }` at
the end of a pass.

## Wiring

[PersonalHubExtension](../PersonalHubExtension.md) wraps the Hub's emit so
every `thread.changed` calls `schedule()`, and
[HubService](../HubService.md)`.saveContexts` calls `schedule(0)` so the
cards are grouped again. The extension hands it the Hub's one
ConversationReader as `reader`, its ContactService as `people` and a
CalendarEvidence over its CalendarService as `meetings`. The slot
is declared in `manifest.js` (optional
`core:llm-service` slot `summarizer`) and picked in Settings > Hub or the
Dashboard's settings panel, both through
[SummarySection](../ui/settings/SummarySection.md), which reads `models()`
and calls `setModel` over the channels `listSummaryModels` and
`setSummaryModel`.

## Why

The user works across many companies and does not want to read every
notification to learn that most of them need nothing. One card per context
answers "what is going on here, and is anyone waiting on me". The signature
keeps a local model's work small (one card per change, after a 15 s pause),
and the rule cards mean the view never depends on a model being loaded.

A notification carries one line, and "is anyone waiting on me" often cannot
be told from it: the question may have been answered since. Reading every
conversation would be slow and would open hidden tabs all day, so the Hub
reads only where the first answer says the user may be needed, a few
conversations per card, and lets the model look again. Most cards need
nothing and cost one call.

A question about when to meet is settled by the meeting, not by a reply the
Hub may never see. The calendar is already synced, so the meetings that
bear on an item ride along with it, and being part of the signature they
rewrite the card the moment one is booked, which is when "someone is
waiting" stops being true.

### What an item knows (2026-11-23)

Traced on a live card: a colleague reported a fault over nine direct
messages, the user fixed it, and her last message was a cheer. The card
said she "sent a celebratory Slack message". The prompt carried only
that newest line, although the feed's own log held the eight before it,
and the conversation was never read because nothing needed the user.
Each item now brings its earlier messages (`_earlier`), which costs no
tab and no extra model call. Replayed on the same card with the same
model (Qwen 3.8 27B), four runs of four said she thanked the user for
resolving the fault she had reported.

What an item still does not know:

- The user's own replies. They are not notifications, so they reach the
  model only through a conversation read, which happens when a card may
  need the user. The system prompt says so, and that thanks after a
  request means the user has dealt with it.
- What a mail says. A Proton notification is the sender and the subject
  (`From: Sender - Subject`), and nothing opens the mail.
- Anything at all from a conversation read while the app sat in the
  tray, until 2026-11-23: the hidden tab was 0x0 there and Slack drew
  one message. See
  [TabLayout](../../../core/browser/tab-view/TabLayout.md).

`node tmp/hub-context-replay.js <card> [--ask 8080 <model>]`
(git-ignored) prints a card's prompt from a copy of the real database
and asks a running llama-server for the card.

### After a dismissal (2026-11-24)

The user dismissed a card, one new line of chatter brought its item
back, and the new card led with a question a colleague had asked the day
before (and a bot had answered), which the user had already ruled out.
Nothing recorded when an item was dismissed, so the earlier messages all
read as equally current. An item now keeps the time of its last
dismissal, the prompt says `they dismissed it ... ago` on its line, and
the messages from before then are listed as `Already seen:`, apart from
the `Earlier:` ones that are new. The system prompt tells the model the
old ones only explain the new ones. They are kept, not dropped, because
a new "any update?" means nothing without the request it follows.

Replayed that day on the same card with the same model (Qwen 3.8 27B
on Basalt) and a dismissal placed between the old question and the new
chatter: without the mark every run led with the old question; with the
mark and a first wording ("do not report them as what is going on")
three runs of four still added that the question "was already
answered"; with the wording that forbids any recap, five runs of six
spoke only of the new chatter and one named the old answer as what the
new message reacted to. A made-up nudge ("any update on this?") after a
dismissed request was flagged as needing the user four runs of four,
with the old request named as what the nudge is about.
`node tmp/hub-context-replay.js <card> --dismissed <minutes> --ask ...`
and `node tmp/hub-dismissed-followup.js` (git-ignored) are those two
checks.

A conversation read at its source is one text with no line drawn through
it; the system prompt asks the model to treat what it shows from before
the dismissal the same way. The dismissal is not part of the signature:
an item cannot come back without new activity, which changes it anyway.

### Asking for the source (2026-11-23)

The user asked for an option, off by default, where the model is asked
to get more context from where a notification came from: a Slack message
opens its conversation, a mail is found in its mailbox and opened. With
`summary.sources` on, the first question lets the model name up to three
items it cannot judge; the Hub reads those in a hidden tab of the session
the notification came from
([ConversationReader](../snapshot/ConversationReader.md), and for mail
[MailboxReader](../snapshot/MailboxReader.md)) and asks once more. There
is one round: what the second answer names is not read. Off, nothing
changes: the model is not told it may ask, and no mail is ever opened.

It is off by default because opening a mail marks it as read, and because
each read is a hidden tab and a second model call. The user's own tabs
are not moved: the persisted tab's session is used, not the tab.

Run live on 2026-11-23 in the installed app, hidden in the tray: the model
asked for two Proton mails, each was opened in a hidden tab, and both cards
were rewritten from the mail bodies. A reply the user sent from another
mailbox is not in the mail that was read, so such a card can still say the
sender is waiting. `node tmp/hub-pass-watch.js <threadId>` (git-ignored)
nudges a pass in the running app and prints the hidden tabs it opens and
each card as it is rewritten; `node tmp/hub-read-watch.js <threadId>`
samples the hidden tab of one read.

### Room to think

The call says nothing about thinking, so a thinking model reasons as it
would in a chat (the user's choice, 2026-11-16: the judgement of who is
waiting is worth the wait). The reasoning counts against `max_tokens` and
the clock, so both leave room for it. Measured that day on Qwen 3.8 27B
(Q6, 14 to 19 tokens a second) with a 25 item card: the reasoning ran from
about 600 tokens (38 to 40 seconds) to about 1700 (124 seconds) for the
same prompt, before a 100 token card. The earlier limits (700 tokens, the
provider's 30 second default) cut that off, and every card failed with
`timeout of 30000ms exceeded`. 3000 tokens covers the longest reasoning seen
with room for a card whose items carry conversations; 3000 tokens take about
210 seconds at the slower speed, so the limit is 300.
