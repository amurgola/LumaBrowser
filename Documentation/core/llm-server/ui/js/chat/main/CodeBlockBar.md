# CodeBlockBar

`core/llm-server/ui/js/chat/main/CodeBlockBar.js`

One floating Copy / Insert bar placed over whichever reply code block the
pointer is on (buttons baked into the markdown would be dropped by a streaming
re-render). Insert shows only beside the Code surface's editor.

## Methods

- `install()`: the bar lives on `<body>` (position fixed needs the viewport,
  which the chat root is not while docked beside Code).
- `hide()`.

Copy reports "Copied" or "Copy failed" for 1.4 s; Insert calls
`codeEditor.insertAtCaret(text)`.
