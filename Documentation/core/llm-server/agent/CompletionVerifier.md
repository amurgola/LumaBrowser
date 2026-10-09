# CompletionVerifier

`core/llm-server/agent/CompletionVerifier.js`

Tracks the page action a final answer would rest on when that action had no
visible effect (evidence outcome `no_change`, see
[ActionEvidence](../../browser/ActionEvidence.md)) and nothing has looked at the
page since: the OSWorld "clicked Submit, said done" failure.

## Methods

- `CompletionVerifier.next(prev, tool, result)`: pure rule. An action tool
  (`click`, `click_at`, `type`, `press_key`, `locate`) that succeeded with
  evidence sets `{ tool }` on `no_change` and clears on anything else; failure
  or no evidence keeps `prev`. A successful read tool (`get_source`,
  `observe_page`, `screenshot`, `get_element`, `extract_data`, `wait_for`,
  `navigate`, `create_tab`) clears. Anything else keeps `prev`.
- `observe(tool, result)` applies the rule to the run's state.
- `takeNudge()`: the nudge text when an action is pending and the run has
  nudges left (`MAX_NUDGES` 1), else null. Spends the nudge and clears.
