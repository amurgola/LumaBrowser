# TestModels

`extensions/model-testing/TestModels.js`

The downloaded chat models a test run can pick.

## Methods

- `new TestModels({ llmServerService, scanner? })` (default `LlmModelsScanner.shared`).
- `list()` resolves `[{ path, stem, label, current }]`: the service's
  `listInstalledChatModels()` rows (image, video, music and speech folders left out, the
  current default first) joined by stem with the scan of the effective models directory
  for each model's weights path. A row with no scanned file is dropped; the first file
  with a stem wins.

## Why

Stored results are keyed by weights path, and the service's installed list carries no
paths on purpose (it is also what a paired sharing client sees). The first-file rule is
the pick a `local::<stem>` chat request makes, so the tab tests the file the chat would load.
