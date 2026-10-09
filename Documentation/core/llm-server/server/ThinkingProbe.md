# ThinkingProbe

`core/llm-server/server/ThinkingProbe.js`

Learns how a running llama-server's chat template controls reasoning by
rendering it through `POST /apply-template`, not by guessing from the file name.

## Methods

- `ThinkingProbe.probe({ post, template = null, timeoutMs = 15000 })` returns
  the facts (see [ThinkingFacts](ThinkingFacts.md)). `post(body)` sends one
  /apply-template request and must resolve with `{ status, data }` even on a
  non-2xx status. `template` is the chat template from `/props`, used for the
  hash and the regex fallback. Probed facts also carry `requests` (renders sent).
- `new ThinkingProbe(options).execute()` is the same call in instance form.
- `ThinkingProbe.templateHashOf(template)` returns a 16-hex-char sha256 prefix;
  [ModelCapsCache](ModelCapsCache.md) keys cached probes by it.
- Constants: `MAX_REQUESTS` (22), `REQUEST_TIMEOUT_MS` (3000, the per-request
  timeout the caller should give its HTTP client), `TOTAL_TIMEOUT_MS` (15000),
  `CONCURRENCY` (4).

## Flow

1. Render the baseline user shape alone. If that fails (older build, or a
   runtime that is not llama-server), return the regex answer: one failed
   request, not twenty.
2. Render the rest of the plan ([ThinkingProbePlan](ThinkingProbePlan.md)) four
   at a time. Renders after the total deadline are recorded as failed unsent.
3. Derive. If no effort level moved the single-turn prompt and the history shape
   rendered, render two history-shape effort requests to tell a history control
   from no control, then derive again.

## Why

The old check was one regex on `/props`: "does the template mention
`reasoning_effort`?" That is wrong in both directions. A Qwen3 template has an
`enable_thinking` toggle and no effort hint, so it got no dial; a template that
interpolates any string looked like it offered every level; and a
fixed-thinking template (Kimi K2.7 Code, MiniMax M2) read as "no control", so
the Off position silently thought anyway.

/apply-template returns the rendered prompt for a messages array, honouring
`chat_template_kwargs` exactly as a chat request would (verified on b10796:
`enable_thinking:false` on a Qwen3 template injects the empty think block). So
the probe renders a handful of conversation shapes with the controls omitted,
enabled, disabled, at each effort level, and at two random strings nobody could
have declared, and reads the answers off the diffs:

- a control that never changes the prompt is not a control;
- a level that renders like the omitted prompt is the default (if the template
  prints the level's name) or is ignored;
- two levels that render identically are aliases, one representative stays;
- a random string appearing verbatim means the template passes anything
  through, which proves nothing about what the model was trained on, so the
  documented low/medium/high is used;
- a change that shows up only in the shape with an earlier assistant turn is a
  history control (keep or drop previous thinking), not an effort.
