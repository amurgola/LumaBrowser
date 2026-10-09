# setup-ui.js, setup-ui.css (chatterbox-voice)

`extensions/chatterbox-voice/setup-ui.js`, `extensions/chatterbox-voice/setup-ui.css`

The Setup area's "Voice cloning" tab, registered with
`window.LumaSetupExt.registerTab({ id: 'chatterbox-voice', label: 'Voice cloning', mount })`
(logs "[chatterbox-voice] LumaSetupExt not present" without the host).
Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts, and the build obfuscates it as one file).

## Behaviour

- Engine and models panel from `status`: audio.cpp runtimes (Install, Use,
  Remove) and Chatterbox models (Download, Cancel, Delete) with progress while
  a job runs (polled every 700 ms); a CPU-build warning.
- Voice cards (the built-in Chatterbox Turbo when available, then cloned
  voices): Play clip, Preview, Use in chat / In use, Edit, Delete (confirmed).
- The add/edit form takes a reference clip from a file or a microphone
  recording (up to 30 s), decodes it with Web Audio, mixes to mono, resamples
  to 24 kHz and sends a 16-bit WAV as base64; it can transcribe and analyse
  the clip.
- Every action goes through `api.invoke(action, payload)` (`status`,
  `runtime.*`, `model.*`, `voices.*`); a failure becomes a warn notice.

## Globals

Reads `window.LumaSetupExt`, `window.LumaModal`, `AudioContext`,
`MediaRecorder`, `navigator.mediaDevices`. Injects
`<link id="cv-css" href="/llm-ui/ext/chatterbox-voice/setup-ui.css">`.
