# FitTestSession

`core/llm-server/ipc/FitTestSession.js`

Runs the empirical fit test from the LLM tab, one at a time.

## Methods

- `new FitTestSession({ llmServerService, gather?, detector?, scanner?, launcher?, fitTester?, resolveCudaDevice?, log? })`
  (defaults `SystemDiagnostics.gather`, `LlmRuntimeDetector.shared`,
  `LlmModelsScanner.shared`, `ServerLauncher.shared`, `FitTester.shared`, `CudaPin.resolveCudaDevice`).
- `running` getter.
- `run({ modelPath }, send)`:
  1. refuses `A fit test is already running.` and `modelPath is required.`;
  2. gathers fresh diagnostics (hardware line from `HardwareSummary`), detects
     runtimes, finds the scanned model (`Model path no longer matches a scanned model.`),
     picks the runtime ([FitRuntimePicker](FitRuntimePicker.md)) with learned
     unsupported flags (`No installed llama.cpp runtime can run this test. ...`);
  3. stops the chat server when `ready` or `starting` (`chat-server { state: 'stopping' }`);
  4. sends `resolved { runtime, model, hardware }`, runs `FitTester#run` with the
     launch API key (when required), the stored prior fit, a per-combo CUDA pick and
     `shouldCancel`, streaming `progress`;
  5. saves the results before sending `done` or `canceled { runtime, results, hardware, ranAt }`;
  6. always restores a stopped chat server (`chat-server` `restarting`, then
     `restarted` or `restore-failed { error }`).
  Resolves `{ success: true, canceled, results, runtime, hardware, ranAt }`; a throw
  sends `error { message }` and resolves `{ success: false, error }`.
- `cancel()` `{ running }`, flagging the live run.
- `status()` `{ running: true, live }` ([FitTestLive](FitTestLive.md)) or `{ running: false, live: null }`.

## Why

A fit test serialises real model loads through finite VRAM, so only one runs;
the snapshot lets a reloaded tab rebind instead of showing an idle button that
then refuses with "already running".
