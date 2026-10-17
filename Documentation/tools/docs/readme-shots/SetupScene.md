# SetupScene

`tools/docs/readme-shots/SetupScene.js`

LLM Setup as the README shows it. `prepare(page, { log })` clicks the button labelled exactly `Setup` (the mode IPC
alone does not swap the surface), waits `SETTLE_MS`, closes every open `details.setup-fold` so Chat defaults,
Inference runtimes and Models directory fit one window, scrolls to the top, drops focus, and runs
[PageSanitizer](PageSanitizer.md) over the page. Returns `{ folded, scrubbed }` counts. Throws when no Setup toggle
exists on the LLM tab.

The command runs this scene before the chat one on purpose: once a model server is up the page gains a "How your
model is running" card that pushes the runtimes and models cards below the fold.

## Methods

- `static prepare(page, { log })`.
- `static showSetup(page)`: true when the toggle was found and clicked.
