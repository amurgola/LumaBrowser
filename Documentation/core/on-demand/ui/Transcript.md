# Transcript

`core/on-demand/ui/Transcript.js`

The panel's message log.

## Methods

- `clear()`: the "Talk to this page" state with clickable `.od-ex` examples (`EXAMPLES`).
- `addUser(text)` (text only), `addAssistant(initialHtml, cls)` -> `{ bubble, body, steps, thinking }`.
- `showPartial(text)`: the live preview bubble (`''` shows "Listening…", null removes it).
- `restore(rows)`: history rows; assistant content through MarkdownRenderer, an
  error escaped with the `error` class; no rows shows the empty state.
- `scrollBottom()`.
