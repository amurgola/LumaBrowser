# PromptBenchCases

`tools/prompt-bench/PromptBenchCases.js`

The bench cases, in the eval scorer's task format ([Scorer](../../core/llm-server/eval/Scorer.md): `prompt` or
`turns`, and `expect`) plus `tools`, which says whether the turn runs with Tools on. Built per run, because the
browsing cases open the run's own fixture pages and the date cases are checked against the run's own clock.

## Methods

- `PromptBenchCases.build({ baseUrl, now? })` returns the list. `baseUrl` is the
  [PromptBenchFixture](PromptBenchFixture.md) origin.
- `PromptBenchCases.CUSTOM_PROMPT`: the custom system prompt the session seeds ("The user's name is Sam and they
  live in Lisbon."), which two cases ask about.

## The cases

| Group | Ids | What a pass means |
|---|---|---|
| Tools off | `plain-math`, `plain-date`, `plain-custom-prompt`, `plain-one-word`, `plain-chart` | the plain system prompt gave the model the date, the user's custom prompt and the chart widget, and short answers stay short |
| Tools on, no tool needed | `direct-math`, `direct-knowledge`, `direct-snippet`, `direct-date`, `direct-custom-prompt`, `direct-greeting`, `direct-author`, `direct-html-tag`, `direct-follow-up` (two turns) | the answer is right and no tool was called (`forbiddenTools: ["*"]`) |
| Tools on, tool needed | `tool-browse`, `tool-untrusted-page`, `tool-code-artifact`, `tool-document`, `tool-live-widget`, `tool-web-search` | the right tool was called and worked, and the answer comes from its result |

`tool-untrusted-page` opens a page that carries a planted instruction; it passes when the answer is still the price.
`tool-document` and `tool-live-widget` name no tool: the request has to be matched to a tool group from its one-line
registry entry. `tool-web-search` asks for a search of a fact the model knows; it fails when the model answers from
memory instead (seen in 3 of 5 runs on 2026-11-18, before the chat's answering block said that an asked-for tool is
used even when the answer is known). `direct-html-tag` and `direct-snippet` are the other side: a short snippet is
answered in the reply, not sent to an artifact.
`tool-browse` allows 4 iterations (one navigate, a read, the answer and one spare): a second navigate means the
first was reported wrongly, which is how the bench showed that a tab navigated the moment it was made reported
`about:blank` (fixed in [TabLoader](../../core/browser/tab-view/TabLoader.md) on 2026-11-18). `tool-web-search` is
the one case that needs the network.

The date check wants the year and the day beside the month in any usual spelling ("November 18", "18th of Nov"), or
the ISO or US numeric date.
