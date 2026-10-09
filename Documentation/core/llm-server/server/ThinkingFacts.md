# ThinkingFacts

`core/llm-server/server/ThinkingFacts.js`

The one contract describing how a model's template controls reasoning: derived
from probe renders, or the coarse regex-era answer in the same shape.

## Methods

- `ThinkingFacts.derive(renders, { nonce, invalid, templateHash = null })`
  returns probed facts, or `null` when the baseline could not be rendered. A
  failed probe is "unknown", never "unsupported". Delegates to
  [ThinkingFactsDeriver](ThinkingFactsDeriver.md). `renders` maps plan keys to
  `{ ok, prompt? , status? }`.
- `ThinkingFacts.fromRegex(template, templateHash = null)` returns the regex-era
  answer: if the template mentions `reasoning_effort`, assume levels
  low/medium/high/xhigh and domain `assumed`, else no reasoning.
- `ThinkingFacts.offersControl(facts)` is true when there is something to put on
  a dial: a toggle, an effort level, or a disable path. A fixed-thinking
  template has none, so it gets no dial, exactly like a template with no
  reasoning.

## Facts shape

`source` (`probe` | `regex`), `probeVersion`, `templateHash`,
`supportsThinkingToggle`, `toggleAffectsHistoryOnly`, `thinkingDefault`
(`on` | `off` | `fixed-on` | `none`), `thinkingFixed`, `effortLevels`
(cheapest first, never `none`), `effortDefault`, `effortDomain` (`open` |
`closed` | `shared-fallback` | `ignored` | `assumed`), `effortAliases`
(level -> representative), `invalidPassesThrough`, `effortAffectsHistoryOnly`,
`disableKwarg` (`{ enable_thinking: false }`, `{ reasoning_effort: 'none' }` or
`null`), `shapes` (which conversation shapes rendered).

Consumers: the reasoning dial (`dialPositionsFor`), the request profile, the
thinking-off resolver and the Local API's Off refusal.
