# ThinkingFactsDeriver

`core/llm-server/server/ThinkingFactsDeriver.js`

Reads facts about a template's reasoning controls off a map of differential
/apply-template renders. Pure, so it is tested against fake renderers. Called
through `ThinkingFacts.derive`.

## Methods

- `new ThinkingFactsDeriver(renders, { nonce, invalid, templateHash }).execute()`
  returns the facts object described in [ThinkingFacts](ThinkingFacts.md), or
  `null` when the baseline user render is missing or lost its nonce.

## Steps and the rules they apply

1. Baselines: each shape rendered with no kwargs. A render that lost the nonce
   is a broken shape and counts as failed.
2. Toggle: `enable_thinking` that moves the user, system or tools shape is a
   toggle; one that moves only the history shape is a history control.
3. Effort domain, from the two random invalid values: any rendered verbatim is
   `open` (pass-through); all rejected is `closed`; any rendered to a distinct
   prompt is `shared-fallback`; otherwise `ignored`.
4. Accepted levels: in `open`, only the documented low/medium/high; in
   `closed`, every level that rendered; otherwise a level that moved the prompt
   to something other than the shared fallback. A level rendering exactly like
   the baseline counts only if the prompt prints the level's own name, since
   the probe's messages contain no level words.
5. Aliases: identical renders collapse to one representative, preferring the
   level whose name the prompt prints, else the highest rank.
6. Summary: `effortDefault` is the representative that renders like the
   baseline. If no level moved the single-turn prompt but low or high moved
   the history shape, the effort is a history control.
7. Default: with a toggle, `on` unless the disabled render equals the baseline;
   else `on` if `none` was accepted; else `fixed-on` if the generation prompt
   opens a think marker; else `on` if any effort level exists; else `none`.
   The disable path is the toggle, else `reasoning_effort: 'none'`.
