# ActivitySummarizer

`extensions/personal-hub/summary/ActivitySummarizer.js`

The distilled view of the activity feed: recent items grouped by context
([ContextService](../context/ContextService.md)), then "Other", each group
one card that says what is going on and whether anything is being asked of
the user. A card is written by the model the user chose for the Hub's
summariser slot (`SLOT` = `personal-hub.summarizer`), and only written again
when its own items changed, so a new notification updates one card and
leaves the rest alone. Without a model, or with summaries switched off,
every card still shows, filled in by plain rules. When a card may need the
user, the conversations behind what is asked are read from the user's own
tabs and the card is written once more with them. The model only proposes:
nothing here creates a task or dismisses anything. Emits `summary.changed`
as cards are written.

## Methods

- `new ActivitySummarizer({ inbox, contexts, summaries, db, llm?, reader?, people?, emit?, now?, debounceMs = 15000 })`:
  `inbox` an [InboxService](../inbox/InboxService.md), `contexts` a
  ContextService, `summaries` a [SummaryRepository](SummaryRepository.md),
  `db` the extension's DatabaseService (the on/off setting), `llm` the app's
  [LLMService](../../../core/llm-service/LLMService.md) or `null`, `reader`
  a [ConversationReader](../snapshot/ConversationReader.md) or `null` (reads
  the conversation behind what may need the user), `people` a
  [ContactService](../contacts/ContactService.md) or `null` (names
  participants as known contacts).
- `status()` -> `{ enabled, available, provider, model, running, lastRunAt,
  lastError }`: `available` is whether the app has an LLM service at all;
  `provider` and `model` are what the slot resolves to right now (the user's
  pick, else the active provider's; `null` when unknown).
- `enabled()`, `setEnabled(enabled)`: the setting `summary.enabled` (off by
  default). Switching it emits `summary.changed`, and switching it on
  schedules a pass at once. Returns `status()`.
- `models()` -> `{ models: [{ value, label }], chosen }`: what the model
  picker shows. Every model the LLM service lists
  (`getAllAvailableModels`), each `value` as `<providerId>::<modelId>`;
  `chosen` is the slot's current model in the same form
  (`getSlotConfig(SLOT)`), or `''` when nothing resolves. Without an LLM
  service it answers `{ models: [], chosen: '' }`.
- `setModel(value)`: `value` is `<provider>::<model>`
  (`setSlotConfig(SLOT, provider, model)`), or `''` to go back to the app's
  active provider (`clearSlotConfig(SLOT)`). Emits `summary.changed` and
  returns `status()`. Throws `No language model service is available to the
  Hub.` without one.
- `cards()` -> `[{ key, contextId, name, color, count, lastAt, items,
  headline, summary, needsYou, reason, asks, source, stale, updatedAt,
  error }]`, contexts in the user's order and "Other" last; a context with
  no recent activity has no card. `source` is `ai` when a stored summary
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
- Signature: a sha1 over the card's name and, for its newest
  `MAX_ITEMS_PER_CARD` = 25 items, each one's id, last activity time, count
  and summary. Those same 25 items are what the model is sent.
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
  max_tokens: 700, label: 'Hub summary: <name>' })` with
  [SummaryPrompt](SummaryPrompt.md)`.messages` over the enriched items, the
  reply read through ResponseText and `SummaryPrompt.parse`. A thrown call,
  a refused reply (`The model did not answer.`) or one that does not parse
  (`The model did not answer in the expected form.`) is the error.
- `_enrich(items)`: the items as the prompt wants them. Each gets `people`
  (`_names`) and `snapshot`: the conversation text when the reader holds a
  snapshot of the item's latest activity (its `sourceAt` equals the item's
  `lastAt`), else empty, so an outdated conversation is never sent.
- `_names(item)`: each participant looked up as a contact
  (`people.lookup({ app, sender, contextId })`). A known one is named as the
  contact, with `(also on slack, gmail)` listing the other apps that person
  appears in; an unknown one, or any when there is no contact service, stays
  as it came.
- When the first answer says the card may need the user (`needsYou`), the
  card is worth a closer look. `_deepen(items, summary)` reads the
  conversations behind the items the answer's asks name, or behind the
  newest item when it named none, at most `DEEP_PER_CARD` = 3, skipping any
  that already has a fresh snapshot. It answers whether anything new was
  read; without a reader or a browser it reads nothing. A tab that cannot
  be read leaves the card as it is.
- Only when something new was read is the model asked once more, now with
  those conversations in the prompt. A usable second answer replaces the
  first; an unusable one (an error, a reply that does not parse) is dropped
  and the first stands.
- The stored row carries the group's signature, so a deepened card is not
  written again until its items change.

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
ConversationReader as `reader` and its ContactService as `people`. The slot
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
