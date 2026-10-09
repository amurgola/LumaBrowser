# SttChoice

`core/llm-server/ui/js/voice/SttChoice.js`

The recognition model choice (Parakeet, Qwen3-ASR, Whisper). Picking one not
installed installs its engine (sherpa-onnx or whisper.cpp) and downloads it,
then sets it as default and pre-warms. Hidden on a remote client.

## Methods

- `new SttChoice(api)`; `render(pop, note)`; `SttChoice.installedFor(entry, view)`
  (sherpa by id, whisper by file name).
