# SetupQuestions

`core/llm-server/ui/js/setup/SetupQuestions.js`

The guided wizards' three questions, held once.

## Members

- `SetupQuestions.QUESTIONS`: `useCase` (`chat`, `development`, `documents`),
  `tkPref` (50, 20, 10 tokens/sec) and `ctxPref` (`short`, `medium`, `long`),
  each `{ label, options: [{ value, title, desc }] }`. Each surface renders its
  own markup around them.

## Globals

None.
