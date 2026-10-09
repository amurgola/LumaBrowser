# LlmQuestionsPane

`core/shell/ui/wizard/llm/LlmQuestionsPane.js` (ES module)

The three local-setup questions, revealed one at a time; the speed question types live at each speed.

## Methods

- `new LlmQuestionsPane(wizard, step)`, `render(pane)`: use, then speed (live
  [SpeedSimulator](../../../../llm-server/ui/js/setup/SpeedSimulator.md) panes;
  timers go through `wizard.addSpeedTimer`), then memory, then "See
  recommendation". Copy from SetupQuestions.

## Globals

None.
