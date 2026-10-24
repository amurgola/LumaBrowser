# DefaultsForm

`core/llm-server/ui/js/setup-ui/defaults/DefaultsForm.js`

Reads the Defaults card's controls into the setDefaults payload; optional rows are sent only when rendered.

## Methods

- `read(doc)`; `thinking(position)`: `'off'` is `noThink`, any other position clears it. The optional rows are RAM pin, tool router, the MoE GPU cache switch (sent inverted as `noMoeGpuCache`) and the OpenVINO device (extra flags are no longer in the card; the per-model Tune dialog saves them) (`openvinoDevice`, `''` sent as null for Auto).

## Globals

None.
