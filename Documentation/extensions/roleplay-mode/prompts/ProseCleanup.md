# ProseCleanup

`extensions/roleplay-mode/prompts/ProseCleanup.js`

Takes the scaffolding off a narrator reply before it is stored, shown and read
back: a markdown heading the model opened with ("# Late afternoon at Bluebird
Cafe"), a bold title line, a horizontal rule, and a label that announces the
private scene notes by name ("*Pressure builds:* ..."). Deterministic, prose
only: nothing a character says or does is touched.

## Methods

- `ProseCleanup.clean(text)` -> the cleaned reply; unchanged text comes back
  as the same string.
  - Up to three headings at the very top are removed with their text.
  - A bold line on its own at the top (`**The Cafe at Dusk**`) is removed when
    prose follows it. A speaker tag (`**Diana:**`) has a colon inside the bold
    and is kept.
  - A heading in the middle of the reply loses its `#` marks and keeps its
    words, which may be story.
  - A paragraph that opens with a notes label (`NOTE_LABEL`: pressure, scene
    notes, story state, open threads or questions, handoff, narrator's notes,
    with or without emphasis marks) loses the label and keeps the sentence.
  - Lines that are only `---`, `***` or `___` are removed.

## Why

The brief forbids all of these, but a model that has read a prompt built from
`## Story so far` headings writes its own, and once one is in the history
every later reply opens with one too.

## Wiring

[RoleplayPostProcessor](../pipeline/RoleplayPostProcessor.md) replaces the
stored reply with the cleaned text before the reaction runs.
[HistoryTrimmer](HistoryTrimmer.md)`.stripDebris` applies it to any reply that
still has a heading when the history is sent back.

## Speech without quotation marks (2026-11-12)

`quoteSpeech(para)` gives a speaker's paragraph written as a script line
(`**Margot:** You're late.`) its quotation marks, only when the paragraph has
no quotation mark at all and reads as speech: it says "I", or opens by
addressing someone. A stage direction in round brackets stays outside the
quotes. Narration under a speaker's name and ambiguous lines are left alone.
