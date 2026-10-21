# BuilderPrompt

`extensions/site-apis/builder/BuilderPrompt.js`

The system prompt of a Site API builder turn, wrapped in `<site_api_builder>`.

## Methods

- `build({ site, endpoints, workTabId, currentEndpoint, persistedTabs })`: the prompt. With `site` null it is
  the unbound prompt (ask which persisted tab, `list_persisted_tabs`, `use_tab`, then end the reply); the
  persisted tabs are listed when known. Bound, it holds:
  - the work tab line (tab id, partition, start URL) or a note that the browser is unavailable;
  - the FLOW: login check (the user signs in by hand in the persisted tab; a login wall is never automated),
    define (`define_endpoint` with params and example values), demonstrate (page tools with the example values,
    `selector` AND `llmFallback` on every targeted call, reads for the model's own eyes are not recorded),
    compile in the same reply (`compile_endpoint`, fix with `set_steps`: placeholders, waits, transforms),
    test twice (`test_endpoint`), save (`save_endpoint`);
  - the step catalog from `StepKinds.CATALOG` with the fields and a one-line meaning (`MEANINGS`), the
    transform ops (`TRANSFORM_OPS`), the current-result rule, the placeholder rule (`{{name}}`, `|url`, `|raw`),
    the returns rule;
  - the site JSON, the endpoints JSON (one line each) and the current endpoint with its steps and whether it is
    recording.

## Decisions

- Demonstrate, compile, fix, test and save happen in one reply: `compile_endpoint` reads the running turn's
  live trace (see [RecordedCalls](RecordedCalls.md)), so no "end the reply first" rule is needed.
- A ref number from `observe_page` is not recorded, hence the selector plus description rule.
