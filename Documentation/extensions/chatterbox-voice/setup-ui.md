# setup-ui.js, setup-ui.css (chatterbox-voice)

`extensions/chatterbox-voice/setup-ui.js`, `extensions/chatterbox-voice/setup-ui.css`

The Setup area's "Voice cloning" tab, registered with
`window.LumaSetupExt.registerTab({ id: 'chatterbox-voice', label: 'Voice cloning', mount })`
(logs "[chatterbox-voice] LumaSetupExt not present" without the host).
Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts).

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
`<link id="cv-css" href="/llm-ui/ext/chatterbox-voice/setup-ui.css">`, which is on tokens.css per the [design system](../../ui/DesignSystem.md) (no fallback greys or greens; the active chip is neutral).

## KittenTTS 2 (2026-10-22)

- The models column is titled "Voice models"; a row shows its `licenseNote`
  (the Stellon Labs commercial terms) under the description and a
  `luma-form-err` line with `runtimeNote` when the installed audio.cpp predates
  the model. Installed engine rows gain a "Reinstall" button (`runtime.install`)
  for that case.
- The header lists `attributions` as chips ("Powered by KittenML") while the
  model is downloaded, as its license requires.
- A "KittenTTS 2" built-in card appears when `kitten.available`, with a
  `select[data-kitten-preset]` of `kitten.groups` (optgroups) that invokes
  `kitten.preset { name }`; Preview and "Use in chat" send voice id `kitten`.
- With two cloning models downloaded, a "Clone with" row
  (`select[data-clone-model]`) invokes `clone.model { id }`.
- The form notes that the transcript is required by KittenTTS 2.
