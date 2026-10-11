# DefaultsForm

`core/llm-server/ui/js/setup-ui/defaults/DefaultsForm.js`

Reads the Defaults card's controls into the setDefaults payload; optional rows are sent only when rendered.

## Methods

- `read(doc)`; `thinking(position)`: `'off'` is `noThink`, any other position clears it. The optional rows are extra flags, RAM pin, tool router and the OpenVINO device (`openvinoDevice`, `''` sent as null for Auto).

## Globals

None.
