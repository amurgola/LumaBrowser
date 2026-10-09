# TriggerMemoryBlock

`core/llm-server/chat/triggers/TriggerMemoryBlock.js`

The persistent-memory block appended to a trigger run's system prompt.

## Methods

- `TriggerMemoryBlock.build(notes, runs, { runsWanted = 5, maxChars = 4000 })`
  returns a newline-joined block inside `<trigger_memory>` tags: a header naming
  `maxChars`, the trimmed notes (or `(no notes yet)`), a digest of up to
  `runsWanted` runs (newest first, as given) or `No earlier runs.`, and the
  `save_memory` instructions. With `runsWanted` of 0 the digest is omitted.
  Each run line is `- <YYYY-MM-DD HH:MM> (<kind>, <status>) in: <input> | out:
  <output>`, input capped at 160 characters and output at 240, whitespace
  collapsed. The input summary is title and body for notifications, else the
  file name or path, the body, or the url.

## Why

A trigger that keeps memory across runs (a chat bot, a follow-up tracker) needs
both what earlier runs decided to remember and a cheap view of what actually
happened. The instructions ask for the complete rewritten notes, not an append,
so the notes stay current instead of growing.
