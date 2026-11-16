# ContactProfiler

`extensions/personal-hub/contacts/ContactProfiler.js`

Learns about a contact from what it sent the user: gathers the contact's
messages from the notification log and the conversations already read from
the user's tabs, asks the Hub's model what they show about who the contact
is, and keeps the answer as suggestions on the contact. It only proposes:
the user accepts or dismisses each one
([PeopleSection](../ui/settings/PeopleSection.md), or a tool through
[HubService](../HubService.md)`.resolveContactSuggestion`).

## Methods

- `new ContactProfiler({ contacts, inbox, snapshots, contexts = null, llm = null })`:
  `contacts` a [ContactService](ContactService.md), `inbox` an
  [InboxService](../inbox/InboxService.md) (the notification log),
  `snapshots` a [SnapshotRepository](../snapshot/SnapshotRepository.md)
  (the conversations read so far), `contexts` a
  [ContextService](../context/ContextService.md) or `null` (files a logged
  message under a context, as the people memory did when it saw the
  sender), `llm` the app's
  [LLMService](../../../core/llm-service/LLMService.md) or `null`.
- `async learn(contactId)` -> `{ contact, read, added }`: `read` is how many
  messages were looked at, `added` how many new suggestions now wait on the
  contact, and `contact` the contact as it is afterwards. With nothing to
  read the model is not asked and the reply is `{ contact, read: 0, added:
  0 }`. Throws `Contact not found.`, `No language model service is
  available to the Hub.` (no `llm`; checked before anything is read), the
  error of a refused reply or `The model did not answer.` when it gave none,
  and `The model did not answer in the expected form.` when the reply does
  not parse.

## Steps

- `_material(contact)` -> `{ messages: [{ at, app, text, threadId }],
  conversations: [text] }`. Reads the newest `LOG_DEPTH` = 3000
  notifications (`inbox.listNotifications`) and keeps those that came from
  one of the contact's identities (`_from`), at most `MAX_MESSAGES` = 40,
  newest first. A
  message's text is its title (unless the title is just the sender's name)
  and body joined by `: `. The conversations are the stored snapshots of
  those messages' activity items (`snapshots.forThreads`), at most
  `MAX_CONVERSATIONS` = 3.
- `_from(notification, identities, known)`: the sender is read by
  `ContactService.parse` and must have the app and handle of one of the
  contact's identities. An address is then enough, in any context. A name
  must also be in that identity's context, the notification's context being
  what `contexts.resolve({ url, partition, host, sender, app })` gives
  (`_contextOf`; none without a context service), so two contacts who share
  a name in two companies each get only their own messages.
- `_ask(contact, material)`: `llm.sendCompletion(SLOT, messages, {
  temperature: 0.1, max_tokens: MAX_TOKENS, timeout: TIMEOUT_MS, label:
  'Hub contact: <name>' })` with
  [ContactProfilePrompt](ContactProfilePrompt.md)`.messages`,
  `MAX_TOKENS` = 3000 and `TIMEOUT_MS` = 300000 (thinking is left to the
  model, so both leave it room to reason first, as in
  [ActivitySummarizer](../summary/ActivitySummarizer.md)), the reply read
  through
  [ResponseText](../../../core/llm-service/ResponseText.md) and
  `ContactProfilePrompt.parse`.
- The proposals are stored through `ContactService.propose`, which leaves
  out what is already known, already waiting or dismissed before.

## The model

`SLOT` = `personal-hub.summarizer`: the model the user picked for the
Hub's summaries ([ActivitySummarizer](../summary/ActivitySummarizer.md))
reads contacts too, so there is no second model to choose.

## Why

The user should not have to type in who everyone is, but nothing a model
reads out of messages is trusted on its own: it waits as a suggestion with
the message it rests on. Only what the contact sent is read, matched by the
same identities the Hub joined into the contact, and a contact with nothing
in the log costs no model call.
