# VoiceSetupRows

`core/llm-server/ui/js/voice/VoiceSetupRows.js`

The setup panel's list of missing engines and models with one install
button (stops at the first failure). One sherpa-onnx install serves both
halves; read aloud needs only the speech half. A remote client lists what is
missing and points at the host (or says the host is not sharing voice).

## Methods

- `new VoiceSetupRows(api)`; `render(rows, note, views, purpose)`;
  `missingItems(stt, tts, ttsOnly)` returns `[{ label, run }]`.
