# LabSetupRunner

`extensions/roleplay-mode/lab/LabSetupRunner.js`

The Lab's setup phase: scene art and base face (base model), then a full body
(edit model).

## Methods

- `new LabSetupRunner(generateImage)`; `run(data)` fills `scene.bg`,
  `char.art.base`, `char.art.fullBody` of the first scene and character.
