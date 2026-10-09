# StreamingMarkdown

`core/llm-server/ui/js/markdown/StreamingMarkdown.js`

Closes the markdown a reply still streaming has left open, so a half-written
answer never flashes raw syntax that the next tokens take away. Used through
`MarkdownRenderer.render(md, { streaming: true })` by live renders only; the
final render gets the text as written.

## Methods

- `StreamingMarkdown.close(md)` returns `md` with open constructs closed:
  - An open code fence (an odd number of ```` ``` ````, counted the way
    `MarkdownRenderer.FENCE_RE` pairs them) is closed, so the code renders as a
    code block while it streams. One or two backticks of a closing fence still
    being typed are dropped first.
  - A fence opening line still being typed (```` ```py ```` with no newline
    yet) is held back: its language is not known yet, and in the chat it may be
    the start of the ```` ```choices ```` fence, which is cut from the live render.
  - On the last line only (inline rules never span lines): an unfinished
    `` `code `` span or `**bold` is closed; a lone trailing backtick, a bare
    trailing `**` and a star just typed after a space are held back until the
    next token; a link whose URL is still arriving shows just its label.

Single-star italics are not closed: a leading `*` is also a list marker, so the
star shows until its pair arrives.

## Globals

None.
