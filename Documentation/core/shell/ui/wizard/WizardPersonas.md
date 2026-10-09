# WizardPersonas

`core/shell/ui/wizard/WizardPersonas.js` (ES module)

The five first-run personas, worded as on the website's front door; the persona picks the onboarding path.

## Methods

- `WizardPersonas.PERSONAS` `[{ id, title, desc }]` for chat, create, build,
  tune, switch; `DEFAULT` = `'chat'`.
- `WizardPersonas.SETUP_LANDING`: personas that finish on the LLM tab's Setup
  view (tune, switch).
- `normalize(id)` (unknown -> chat), `find(id)`, `isPlain(id)` (chat and create
  get plain-English copy).

## Globals

None.
