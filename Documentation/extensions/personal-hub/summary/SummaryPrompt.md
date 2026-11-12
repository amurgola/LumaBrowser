# SummaryPrompt

`extensions/personal-hub/summary/SummaryPrompt.js`

The words of the activity summariser: turns one context's activity items
into the chat messages sent to the model, and reads the model's reply back
into a summary. The model is asked to rule things out for the user: say what
is going on in a few plain sentences and name only what is genuinely being
asked of them.

## Methods (static)

- `SYSTEM`: the system prompt. It asks for only a JSON object
  `{ headline, summary, needsYou, reason, asks: [{ id, what }] }`: a headline
  of at most 12 words, a summary of 1 to 3 short sentences, `needsYou` true
  only when someone is waiting on the user for a reply, a decision or an
  action (or something they own is failing), the `reason` saying who waits
  and for what, and at most 4 `asks` whose `id` is copied from an item. Two
  lines explain what an item may carry: `Conversation:` lines are the
  conversation itself as read from the user's own screen, to be trusted over
  the one-line notification and used to tell whether a question was already
  answered; and people are named as the user knows them, `(also on ...)`
  meaning the same person writes from those apps too. An item too thin to
  tell is not to be guessed at.
- `messages(context, items, { now? })` -> `[{ role, content }]` (system, then
  user). `context` is `{ name }`; `items` are feed items, newest first. The
  user message names the context and the time, then one line per item:
  `- [thr_id] kind/app: "Title" with participants (30 min ago; 3
  notifications; marked urgent; already a task on their board): text`, the
  text being the item's summary or the last notification's body or title,
  cut to `ITEM_CHARS` = 320. An item may carry two extras
  ([ActivitySummarizer](ActivitySummarizer.md) adds them): `people`, the
  participants named as known contacts (`Dana Reyes (also on slack)`), which
  replace the participants in the line; and `snapshot`, the conversation
  text read from the tab, which follows the item's line as an indented
  `Conversation:` block, one indented line per non-empty line of the text.
  Only the newest `SNAPSHOT_CHARS` = 1500 characters are sent, behind a
  leading `[...]` when the text was cut.
- `parse(text, items)` -> `{ headline, summary, needsYou, reason, asks:
  [{ threadId, what }] }`, or `null` when the reply is not a usable answer
  (no JSON object, or neither a headline nor a summary). Reads the first
  `{...}` span that parses, after dropping `<think>` sections, so a reply
  that reasons first or wraps the object in a code fence still works. The
  headline is cut to `HEADLINE_CHARS` = 90, the summary to `SUMMARY_CHARS` =
  600, the reason and each ask to `REASON_CHARS` = 160; a missing headline
  falls back to the summary. Asks naming an item that was not sent are
  dropped, at most `MAX_ASKS` = 4 are kept, and when `needsYou` is false the
  reason and the asks are emptied.

## Why

Most notifications need nothing from the user, so the prompt is written
around ruling things out, and `parse` enforces what the prompt asks: the
model cannot invent an item to act on, and cannot list asks while saying
nothing needs the user. A notification carries one line, which is often too
thin to tell whether anyone is still waiting, so the conversation is sent
when the Hub has read it, cut to its newest end to keep a local model's
prompt small. Naming people as known contacts lets the model see that a
Slack name and a mail sender are one person.
