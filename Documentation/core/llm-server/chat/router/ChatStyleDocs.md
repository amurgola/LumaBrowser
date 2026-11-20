# ChatStyleDocs

`core/llm-server/chat/router/ChatStyleDocs.js`

The per-turn style documents the chat injects, and the plain path's fold into the system head.

## Methods

All static.

- `CHOICES`: the "Suggest replies" document (a closing ```choices fence of three JSON-array replies, rendered as chips).
- `VOICE`: the voice-mode document (replies read aloud by TTS).
- `WIDGETS`: the inline widgets document (```` ```chart ```` and ```` ```stats ````
  fences, with the spec shapes), worded as opt-in ("only when it clearly
  helps") because small models given a format tend to use it everywhere. Plain
  chats only: not in a chat mode or a voice turn. Its first sentence names the
  fence labels and says the label is what makes a block a widget: told only "a
  fenced JSON block", Gemma 4 E4B wrote the right JSON in a ```` ```json ````
  block, which the chat shows as code (7 of 9 trials on the prompt bench,
  2026-11-18).
- `VOICE_REMINDER`: a terse restatement appended to every agent iteration (under 300 characters).
- `appendToSystemHead(messages, doc)`: appends `doc` to a leading system message, or prepends one; never a second system turn; does not mutate.

## Why

Voice rules in the system head stop steering after a long tool loop (observed: the model quoted them in its reasoning, then emitted headings and raw URLs), so the agent path also restates them where the model is looking.
