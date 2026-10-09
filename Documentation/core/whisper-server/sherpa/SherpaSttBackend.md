# SherpaSttBackend

`core/whisper-server/sherpa/SherpaSttBackend.js`

The in-process speech-to-text backend: keeps a resident utilityProcess
([SherpaSttWorker](SherpaSttWorker.md)) running one sherpa-onnx
`OfflineRecognizer` (Parakeet TDT v3 or Qwen3-ASR). The fork, handshake, crash
and stop supervision is the shared
[SherpaWorkerProcess](../../tts-server/runtimes/SherpaWorkerProcess.md) (label
`STT`), the same one the TTS service uses; this class adds model reuse, request
routing, timeouts and idle unload, so
[WhisperServerService](../WhisperServerService.md) treats it and the whisper.cpp
HTTP server alike.

## Methods

- `new SherpaSttBackend({ runtimesDir, fork? })`; `runtimesDir()` is read live;
  `fork` is the SherpaWorkerProcess test seam (default Electron's `utilityProcess.fork`).
- `state` (getter): `idle | starting | ready | stopping | error`.
- `isRuntimeInstalled()` is `SherpaRuntimeLayout.isInstalled(runtimesDir())`.
- `setIdleTimeout(ms)` sets the idle-unload window (0 disables) and arms it when
  ready and idle. `markActive()` re-arms it.
- `getStatus()` returns `{ state, modelId, lastError, engine: 'sherpa' }`.
- `ensureRunning(model)` (serialized) needs a scanned sherpa descriptor
  (`engine: 'sherpa'`, else throws), an installed runtime (else
  `STT_RUNTIME_MISSING`, `installable: true`), and reuses a ready worker for the
  same model id; otherwise it stops any worker and forks a new one with
  `SttRecognizerConfigBuilder.build(model, model.dir, threadCount())` and the
  `SherpaWorkerEnv` library path. Rejects with the worker's `init-error` (else
  `STT init failed`), with `The speech recognition model did not load within 120s.`,
  or with `STT worker exited unexpectedly (code=N).`
- `transcribe(wav, { language })` resolves `{ text, lang, durationMs, audioSec }`;
  rejects when not ready, on a worker error, after 60 s, or when the worker dies.
  The idle timer is disarmed while any request is in flight.
- `stop()` asks the worker to shut down and kills it after 3 s
  (`SherpaWorkerProcess.STOP_GRACE_MS`).
- `SherpaSttBackend.threadCount(cpuCount)` is half the cores clamped to 2..8.
- Statics: `READY_TIMEOUT_MS`, `TRANSCRIBE_TIMEOUT_MS`, `STOP_GRACE_MS`,
  `WORKER_FILE`, `MIN_THREADS`, `MAX_THREADS`.

## Why

Measured 2026-10-03 (12 threads, CPU): Parakeet v3 int8 loads in about 8 s and
transcribes a 5 s utterance in about 240 ms, well inside voice mode's 1.2 s
partial cadence; Qwen3-ASR 0.6B int8 loads in about 15 s and takes about 1.4 s,
fine for final transcripts. Recognition is a short burst per utterance, hence
whisper's thread clamp rather than the TTS one. Worker stderr is filtered of
onnxruntime and resampler chatter.
