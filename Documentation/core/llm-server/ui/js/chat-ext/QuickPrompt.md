# QuickPrompt

`core/llm-server/ui/js/chat-ext/QuickPrompt.js`

The small text prompt the image and character-art fields open for a subject.

## Methods

- `QuickPrompt.open(title)` shows a `.luma-modal` card with a textarea, OK and
  Cancel; resolves the trimmed text (an empty answer is `null`) or `null` on
  Cancel or a backdrop click.
