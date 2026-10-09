# StorageLine

`core/llm-server/ui/js/wizard/StorageLine.js`

`StorageLine.mount(host, needBytes, api)`: "path · N GB free · Change" under a recommendation, with a warning when the drive has under 110% of the download free. Change uses `pickModelsDir` and `setModelsDir`. Silent on older preloads and failures.

## Methods

- `StorageLine.isTight(freeBytes, needBytes)`.

## Globals

None.
