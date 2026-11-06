# DigDeeper

`core/palette/DigDeeper.js`

"Dig deeper" in the search palette: gathers what the app knows about the query
and has the chat model answer from that material only, streamed back to the
palette. The material is the best matching settings with their descriptions
(`[S#]`), the user's conversations with their matching snippet (`[C#]`, only hits
scoring at least 0.5) and passages of the LumaBrowser documentation (`[D#]`, from
[DocsKnowledgeBase](../rag/DocsKnowledgeBase.md)).

## Methods

- `new DigDeeper({ settings, conversations, docs, getRouter })`: `getRouter()`
  returns the UnifiedChatRouter (`completeStream`), or null before chat exists.
- `start(query, emit, owner?)`: aborts any previous run, gathers, emits
  `context { chips }` (every setting and conversation it may cite, as openable
  rows with their tag), then streams the answer as `delta { text }` and
  `done { text }`. `error { message, noModel? }` when there is no router or the
  model fails; `noModel` is set when no model is configured. The request uses
  temperature 0.2, thinking off and a 120 s timeout. The run is current from its
  first line, so an abort while the material is still being gathered stops it
  before the model is called.
- `abort(owner?)`: stops the current run; with `owner` (the palette view that
  started it) only when that palette owns it, so closing one window's palette
  never stops a dig in another.
- `gather(query)`: `{ text, chips }`, the MATERIAL block and its chips.

## Why

The system prompt keeps the answer short (120 words at most), tied to tags that
exist in the material, and honest when nothing matches. Sending the chips before
the answer lets the palette turn each `[S1]` or `[C2]` into a link to the real
place as it streams in.
