# ContextAudit

`extensions/roleplay-mode/lab/ContextAudit.js`

What one narrator request spends its context on, so a Lab run shows whether a
feature crowds the window. It counts, in tokens:

- each system-prompt layer, split on its `## ` headings (the text before the
  first heading is `brief`);
- the trimmed history, and how much of it is `<think>` reasoning that leaked
  back in;
- the trailing scene notes (`[Scene notes ...]`) and the player's own line;
- repeated content: six-word phrases shared by two layers, or by a layer and
  the history.

[LabTextRun](LabTextRun.md) keeps one audit per turn (`transcript[i].audit`)
and a run-level `context` summary. The report prints both, and the CLI prints
the summary.

Measured on 2026-11-08 (Qwen3.8-27B, 16k window, five flagged bodies):

| Part | Tokens per turn |
|---|---|
| Body notes layer | 1.1k to 1.6k (the largest layer) |
| Cast cards | about 1k |
| Story so far | about 0.6k |
| Fixed brief | about 0.8k |
| History at turn 10 | about 4.4k |
| Reasoning in history | 0 |

Repeats were 25 to 33 phrases, mostly a character's marks shown both on the
card and in the up-close block. That dropped to about 5 once the marks moved
instead of being copied; what remains is each outfit on both the card and the
scene notes, which is deliberate.

## Methods

- `ContextAudit.of(messages)` -> `{ total, system, state, layers, history,
  historyMessages, think, anchor, user, duplicates: [{ a, b, words, sample }],
  duplicateWords }`. `system` is the stable head; `state` is the story state
  the mode writes after the player's text in the newest message
  ([NarratorContext](../prompts/NarratorContext.md)); `layers` covers both.
- `splitState(text)` -> `{ state, user }` for the newest message without its
  scene notes; `sections(prompt, lead = 'brief')`, `duplicates(parts)`,
  `shingles(text)`.
- `summary(audits)` -> averages over the run plus `peak`, or null.
