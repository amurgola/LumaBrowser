# TriggerCardActions

`core/llm-server/ui/js/triggers/TriggerCardActions.js`

Handles clicks on the card's `data-act` buttons directly over `api.triggers`
(no model turn). Composer and secret toggles are local; adopt, restore,
approve and secret-save hold `busy` then refresh; test, arm, pause, send,
pickfile and latest run one at a time and show Running while a real run is in
flight (capturing a sample is not a run). Outcomes become card notes.

## Methods

- `new TriggerCardActions(card, { openRuns })`; `handle(event)`.
