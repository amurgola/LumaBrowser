# MediaScene

`tools/docs/readme-shots/MediaScene.js`

The Image tab of LLM Setup, as [features/media.md](../../../features/media.md) shows it: the Setup side of the
toggle, the Setup nav entry labelled exactly `Image`, scrolled to the top, with the machine name and home dir
scrubbed by [PageSanitizer](PageSanitizer.md). It runs before any server starts, so the Image server card reads
"stopped" and nothing is loaded onto a GPU for the picture.

## Methods

- `static prepare(page, { log })`: shows the tab and scrubs it; throws when the Setup toggle or the Image tab is
  missing. Returns `{ scrubbed }`.
- `static showTab(page, label)`: clicks the button or link whose text is exactly `label`; false when there is none.
- `static reset(page)`: back to the `LLM` tab, so a later Setup or fit scene finds the page it expects.
