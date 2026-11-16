# TrainedLoraInstaller

`extensions/lora-trainer/TrainedLoraInstaller.js`

Moves a finished run's LoRA into the library.

## Methods

- `availableName(wanted)`: `wanted`, or `wanted_2`, `wanted_3`, ... when the library already
  holds that name.
- `outputFile(job)`: `<output>/<name>/<name>.safetensors`, where ai-toolkit writes the final file.
- `install(job)`: imports that file through the host with the sidecar
  `{ family, recipeId, trainedFor, trigger, trainer, steps, createdAt }`; throws when the
  trainer wrote no file.
