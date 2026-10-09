# LoopFeedback

`core/llm-server/chat/tool-loop/LoopFeedback.js`

Writes the model-facing text for a loop finding.

## Methods

- `LoopFeedback.compose(finding, level)`: the `OBSERVED` sentence for the
  pattern, then the instruction for the level:
  - `steer`: the pattern's `REDIRECT`;
  - `insist`: a firm "change course" line plus the redirect;
  - `conclude`: `WRAP_UP`, which asks for the reply to the user now.
- Unknown patterns get a generic sentence. No text uses an em-dash.

## Why

Small models follow short, literal, positively phrased instructions better
than prohibitions (negated prompts are a documented weakness). So each message
says what happened, with the facts (step number, earlier query, counts), and
then names one concrete next action. Held calls start "Skipped:" and notes
start "Heads-up:", so the model can tell a call that did not run from one that
did.
