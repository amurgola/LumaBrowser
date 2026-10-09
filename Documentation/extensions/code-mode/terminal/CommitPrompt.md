# CommitPrompt

`extensions/code-mode/terminal/CommitPrompt.js`

The commit-message prompt and the reply cleanup.

## Methods (static)

- `build({ diff, files?, hint?, subjects? })` -> the rules (subject line under
  72 chars, optional bullet body, intent over file lists, text only), then up to
  12 recent subjects as a style sample, the developer's note (600 chars), up to
  200 files (`- <status> <path>`), and the diff in a fenced block, capped at
  96 KB with a "diff truncated here" note.
- `clean(text)` drops `<think>` blocks, one wrapping code fence, a
  `Commit message:`/`Subject:`/`Message:` label and wrapping quotes, trims
  trailing spaces and collapses blank-line runs; `''` when nothing is left.
- `STYLE_SAMPLE` (12), `MAX_DIFF_CHARS`, `MAX_FILES`.
