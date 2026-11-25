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
  and for what, and at most 4 `asks` whose `id` is copied from an item.
  The summary is to say what a message is about, not how it sounds
  ("thanked them for fixing the export", not "sent a cheerful message").
  A mail item is said to give its subject and who it is from. `Earlier:`
  lines are what else arrived in the same conversation before its newest
  message, oldest first: the newest message is to be read in their light,
  and since they are only what reached the user, never the user's own
  replies, thanks or relief after a request means the user has already
  dealt with it. An item marked `they dismissed it ... ago` is one the
  user already looked at and put away and a newer message brought back:
  only what arrived after that is news (its newest message and its
  `Earlier:` lines), while its `Already seen:` lines and whatever a
  `Conversation:` shows from before then are background that explains
  the new messages. The headline and summary are to be about the new
  messages only, with no recap of what was asked, answered or settled
  before (not even to say it is settled); an already seen message may
  come up only inside a sentence about a new one that cannot be
  understood without it, and an old request counts as needing the user
  only when a new message raises it again.
  Three more lines explain what an item may carry: `Conversation:` lines are the
  conversation itself as read from the user's own screen, to be trusted over
  the one-line notification and used to tell whether a question was already
  answered; `On their calendar:` lines are meetings already booked with the
  same subject or with just the person who wrote, and when such a meeting
  answers what the item asks (a time to meet, a choice between days) the
  ask is settled, is not to be counted as needing them, and the summary
  says the meeting is booked and when; and people are named as the user
  knows them, `(also on ...)` meaning the same person writes from those
  apps too. A further line says a `Who is who` list may follow the
  activity: what the user recorded about the
  people in it, to judge how much a message matters to them and to say who
  someone is, never repeating private details the activity does not call
  for. An item too thin to tell is not to be guessed at.
- `MORE`: two lines added to the system prompt when the model may ask to
  see more (`askMore`). It may add `"more": [string]` to the object: the
  ids of at most 3 items it cannot judge from what is given and whose
  conversation or mail would settle what they are about or whether they
  need the user. It is told the Hub will open those at their source and
  ask again, to ask for nothing that already has `Conversation:` or
  `Mail:` lines, nothing for newsletters, promotions, automated notices
  or anything already clear, and to write the rest of the object from
  what it has without mentioning that it asked.
- `more(text, items)` -> the ids the model asked to see: only items that
  were sent, each once, at most `MAX_MORE` = 3; empty when it asked for
  none or the reply holds no object.
- `messages(context, items, { now?, who?, askMore? })` -> `[{ role, content }]` (system, then
  user). `context` is `{ name }`; `items` are feed items, newest first. The
  user message names the context and the time, then one line per item:
  `- [thr_id] kind/app: "Title" with participants (30 min ago; 3
  notifications; marked urgent; already a task on their board; they
  dismissed it 2 h ago): text` (the last fact only for an item with a
  `dismissedAt`, one the user dismissed and new activity brought back), the
  text being the item's summary or the last notification's body or title,
  cut to `ITEM_CHARS` = 320. A mail reads `subject "Title" from
  participants` instead (`_subject`), and an item whose title is its one
  participant (a direct message) is the title alone. An item's `earlier`
  (`[{ at, sender, text }]`, oldest first) follows its line as an
  indented `Earlier:` block (`_earlierBlocks`), one line per message:
  `- 2 h ago, Sender: text`, the text cut to one line of `EARLIER_CHARS`
  = 280, an empty one left out, at most the newest `MAX_EARLIER` = 8.
  Messages marked `seen` (they arrived before the user dismissed the
  item) stand apart in an `Already seen:` block ahead of the `Earlier:`
  one, each block left out when it has no lines (`_earlierLines`). One
  card carries at most `EARLIER_BUDGET` = 6000 characters of these
  blocks, handed out from the newest item down; an item whose block no
  longer fits goes without. An item may carry three more extras
  ([ActivitySummarizer](ActivitySummarizer.md) adds them): `people`, the
  participants named as known contacts (`Dana Reyes (also on slack)`), which
  replace the participants in the line; `snapshot`, the conversation
  text read from the tab, which follows the item's line as an indented
  `Conversation:` block, one indented line per non-empty line of the text.
  Only the newest `SNAPSHOT_CHARS` = 1500 characters are sent, behind a
  leading `[...]` when the text was cut. A mail read in its mailbox
  (`snapshotScope` = `mail`) follows as a `Mail:` block instead and keeps
  its first 1500 characters, before a closing `[...]`; and `meetings`, the coming
  meetings that bear on the item ([CalendarEvidence](CalendarEvidence.md)),
  which follow as an indented `On their calendar:` block (`_calendar`),
  after the conversation when there is one. Each meeting with a title and a
  start is one line: `- "Title" Fri, Nov 20, 1:30 PM (in 1 d), with
  <attendees>, booked by <organizer>`, the title cut to `HEADLINE_CHARS`,
  at most `MAX_ATTENDEES` = 6 attendees, and the `with` and `booked by`
  parts left out when empty. The time (`_when`) is the start in the
  machine's own time zone, worded in US English, with `, all day` for an
  all-day event, then how far off it is: `within the hour`, `in N h` under
  a day, else `in N d`. `who` (`[{ name, about }]`, default
  empty) is what the user recorded about the people in the items: after the
  item lines comes `Who is who:` with one `- Name: about` line each, at most
  `MAX_WHO` = 12, entries without a name or an `about` left out; nothing is
  added when none is left.
- `parse(text, items)` -> `{ headline, summary, needsYou, reason, asks:
  [{ threadId, what }] }`, or `null` when the reply is not a usable answer
  (no JSON object, or neither a headline nor a summary). Reads the first
  `{...}` span that parses, after dropping `<think>` sections
  ([ModelText](../ModelText.md)`.json`), so a reply that reasons first or
  wraps the object in a code fence still works. Texts are cut to one line
  by `ModelText.clip`, ending in `...` when cut. The
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
prompt small. The newest line of a conversation often means nothing alone
("You are the best!"), so the messages before it ride along from the
feed's own log; and a mail read as `"Subject" with Sender` was taken by
the model for a person writing with a company, so a mail names its
subject and its sender as such. Those same earlier messages became the
news of a card the user had dismissed: one new line of chatter brought
the item back and the card retold a question from the day before. So a
dismissal draws a line through an item: what came before it is labelled
as already seen and kept only to explain what came after. Naming people as known contacts lets the model see that a
Slack name and a mail sender are one person, and the who-is-who list tells
it who they are to the user: a message from an ex-wife or a landlord weighs
differently from a newsletter. A booked meeting is listed under the item
that asked for one because it is the plainest evidence that a scheduling
question is over, and the system prompt says in as many words what such a
line means.
