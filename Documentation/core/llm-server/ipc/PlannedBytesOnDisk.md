# PlannedBytesOnDisk

`core/llm-server/ipc/PlannedBytesOnDisk.js`

How much of an automatic-setup plan's download is already on disk.

## Methods

- `new PlannedBytesOnDisk({ llmServerService, imageServerService?, imageScanner? })`;
  `imageServerService` is a getter, `imageScanner` defaults to a lazy `ImageModelsScanner`.
- `measure(plan)` resolves `{ llmBytes, imageBytes, totalBytes }`:
  - `llmBytes` the size of `<modelsDir>/<plan.llm.file>`, else its `.partial`, capped at `approxBytes`;
  - `imageBytes` the sum of the installed image model's file `bytes`, capped at
    `approxTotalBytes`; 0 without an image service or on a scan failure.

## Why

A re-run after a failure or cancel quotes the remaining download instead of the
whole plan again. Music is not counted: its snapshot folders resume on their own.
