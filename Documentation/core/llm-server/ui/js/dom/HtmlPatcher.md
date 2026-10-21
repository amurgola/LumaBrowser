# HtmlPatcher

`core/llm-server/ui/js/dom/HtmlPatcher.js`

Writes a new HTML string into an element without rebuilding what has not
changed.

## Methods

- `HtmlPatcher.apply(el, html)`: parses `html` (a `<template>`), keeps the
  leading nodes of `el` that are the same as the new ones (text by value,
  elements by `outerHTML`); when the first node that differs is the same kind
  of element (same tag and attributes) it is patched inside, the same way,
  rather than replaced; everything after is removed and the new nodes from
  there on appended. Returns the number of top-level nodes kept. `null`
  empties the element. The result is always what `el.innerHTML = html` would
  have produced.

## Why

The chat's live answer is re-rendered from its whole text on every flush. With
`innerHTML` that rebuilt every node, so a long reply with code blocks got
choppier as it grew: layout and style for thousands of nodes 18 times a second,
images recreated, animations restarted. Streamed text only grows at the end, so
the first changed node is the last block; everything before it keeps its DOM.
The descent matters because the chat renderer joins consecutive paragraphs into
one `<p>` with `<br>`s, so a prose answer is one top-level node: patching
inside it keeps the earlier text nodes and inline elements, and a growing code
block keeps its highlighted spans. This is the DOM half of what Streamdown's memoised blocks do; the
[CodeHighlighter](../markdown/CodeHighlighter.md) cache is the string half.

A node that [StreamFade](../chat/stream/StreamFade.md) has wrapped words in
differs from its fresh counterpart until the fade window passes (about half a
second), so it is rebuilt a few more times; that is the tail of the answer,
which is being rebuilt anyway.

## Globals

None.
