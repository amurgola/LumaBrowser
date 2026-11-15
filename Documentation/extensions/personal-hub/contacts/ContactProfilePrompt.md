# ContactProfilePrompt

`extensions/personal-hub/contacts/ContactProfilePrompt.js`

The words of the contact profiler
([ContactProfiler](ContactProfiler.md)): turns one contact, what is already
recorded about it and what it sent the user into the chat messages for the
model, and reads the reply back into proposals. The model is asked for what
the messages plainly show about who the contact is, and for nothing when
they show nothing.

## Methods (static)

- `SYSTEM`: the system prompt. It asks for only a JSON object
  `{"suggestions": [{"key": string, "value": string, "why": string}]}` and
  lists the keys: `kind` (`person`, or `general` for a business, an
  organisation or an automated sender), `relation`, `birthday`
  (`YYYY-MM-DD`, or `MM-DD` when the year is not said), `sex` (`female`,
  `male` or `other`), `what`, `website`, `detail:<Label>` (another way to
  reach them or a labelled fact, such as `detail:Phone`) and `note` (one
  short sentence worth remembering). `why` quotes or points at the message
  that shows it. At most `MAX_PROPOSALS` = 6; never repeat what is already
  recorded, never guess from the name alone, and leave out anything the
  messages do not state. Most messages show nothing, and then nothing is to
  be proposed.
- `messages(contact, material)` -> `[{ role, content }]` (system, then
  user). `contact` is as ContactService gives it (`{ name, kind, about,
  identities }`); `material` is `{ messages: [{ at, app, text }]` newest
  first, `conversations: [string] }`. The user message reads:
  `Contact: <name> (recorded as a person | general contact)`, `Appears as:
  <app>: <display or handle>; ...` (`unknown` with none), `Already
  recorded: <about>` (`nothing` when blank), `Messages from them (<n>,
  newest first):`, one `- YYYY-MM-DD app: text` line per message, the text
  cut to `MESSAGE_CHARS` = 280 by [ModelText](../ModelText.md)`.clip`, then
  each conversation as `Conversation as read from their screen:` with its
  non-empty lines indented by four spaces. Only the newest
  `CONVERSATION_CHARS` = 1500 characters of a conversation are sent,
  behind a leading `[...]` when cut.
- `parse(text)` -> `[{ key, value, why }]` (possibly empty), or `null` when
  the reply is not a usable answer (no JSON object, or no `suggestions`
  array). Reads the object with `ModelText.json`, so reasoning and code
  fences around it do not matter. Keys are trimmed, values and reasons cut
  to `VALUE_CHARS` = 200, entries without a key or a value dropped, and at
  most `MAX_PROPOSALS` kept. Whether a key and value make sense is left to
  [ContactProfile](ContactProfile.md)`.propose`.

## Why

Most of what a contact sends says nothing about who they are, so the
prompt is written around proposing nothing, and asks for the message
behind each claim so the user can judge it before accepting. Sending what
is already recorded keeps the model from proposing it again.
