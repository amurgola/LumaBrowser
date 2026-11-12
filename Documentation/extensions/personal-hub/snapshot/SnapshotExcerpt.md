# SnapshotExcerpt

`extensions/personal-hub/snapshot/SnapshotExcerpt.js`

Cuts the part of a page that is about one activity item out of the page's
text: the lines that mention the item's subject, people or latest message,
each with a few lines around it. A page that mentions none of them is
showing something else and gives nothing. Used by
[ConversationReader](ConversationReader.md) when it reads the user's tab
where it stands.

## Methods (static)

- `needles(item)` -> what to look for in the page, lower case and without
  duplicates: the item's title, each participant, the last notification's
  sender, and the opening `BODY_WORDS` = 6 words of its body. A leading `#`
  is dropped (a channel name), and anything shorter than `MIN_NEEDLE` = 4
  characters is left out as too common to mean the item.
- `around(text, needles, { maxChars = MAX_CHARS })` -> the excerpt, or `''`
  when no line matches (or there are no needles). `text` is the page as
  markdown or plain text. Every line containing a needle is kept with
  `BEFORE` = 4 lines above it and `AFTER` = 14 below; a skipped stretch
  between two kept parts shows as `[...]`, and runs of blank lines collapse
  to one. A page whose lines match everywhere (it is the conversation)
  comes back whole. The result is cut by `tail`.
- `tail(text, maxChars = MAX_CHARS)` -> the end of a long text, where the
  newest messages of a conversation are: at most `MAX_CHARS` = 4000
  characters, starting at a line break when one comes within the first 200,
  under a leading `[...]`. A shorter text comes back trimmed and whole.

## Why

The user's tab is never navigated, so what it shows may be another
conversation altogether. Keeping only what mentions the item, and nothing
when nothing does, is the honest answer in that case: the reader can then
say the tab is showing something else instead of handing the summariser a
stranger's conversation.
