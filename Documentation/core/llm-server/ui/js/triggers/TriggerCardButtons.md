# TriggerCardButtons

`core/llm-server/ui/js/triggers/TriggerCardButtons.js`

The card's action row and sample composer. Lifecycle buttons follow the
status (Test now / Test again, Arm, Resume, Pause); the sample button follows
the kind (Use a file, Use latest check, Send a sample); View runs appears once
there are runs or the trigger is armed. Busy or running disables all but View
runs.

## Methods

- `build(trigger, state)`; `DEFAULT_SAMPLE` (`{ "text": "hello world" }`).
