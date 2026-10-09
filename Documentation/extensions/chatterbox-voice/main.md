# chatterbox-voice (manifest.js, main.js)

`extensions/chatterbox-voice/manifest.js`, `extensions/chatterbox-voice/main.js`

The Chatterbox voice-cloning add-on: clone a voice from a short recording and
have voice conversations and read-aloud speak with it. Resemble AI's open
Chatterbox models (MIT) run on the audio.cpp engine (Apache-2.0, GPU or CPU) as
an extra engine in the chat's voice picker, with a "Voice cloning" tab in LLM
Setup to manage voices. `private` and `distributable`.

## Entry

- `manifest.js` keeps the legacy id, fields and text, `main: './main.js'` and
  `setupTab { id, label: 'Voice cloning', file: './setup-ui.js', assets: ['./setup-ui.css'] }`.
  The bundle and its assets stay at the extension root because the loader
  whitelist and URL stamping use the basename.
- `main.js` holds one [ChatterboxExtension](ChatterboxExtension.md) and exports
  `{ activate(context), deactivate(), _internals: { handleInvoke, status, modelsDir, runtimesDir } }`.
- `setup-ui.js` and `setup-ui.css`: see [setup-ui](setup-ui.md). Their
  main-process contract is the `setup.invoke` action set in
  [ChatterboxSetupActions](ChatterboxSetupActions.md) and
  [ChatterboxVoiceActions](ChatterboxVoiceActions.md), unchanged.

## Flow

1. Activation loads [ChatterboxSettings](ChatterboxSettings.md), opens the
   [VoiceStore](VoiceStore.md), registers a [ChatterboxEngine](ChatterboxEngine.md)
   with `context.voice.registerTtsEngine` and the Setup handler with
   `context.setupTab.onInvoke`.
2. The tab installs an audio.cpp build ([RuntimeInstallJob](RuntimeInstallJob.md)
   over [AudioCppRuntimeInstaller](AudioCppRuntimeInstaller.md)) and downloads
   models ([ModelDownloadJob](ModelDownloadJob.md)), polling
   [ChatterboxStatus](ChatterboxStatus.md).
3. Voice mode, read-aloud and the `/voice` routes call the engine, which starts
   [AudioCppServer](AudioCppServer.md) from an [AudioCppLaunch](AudioCppLaunch.md)
   on demand.

Base classes reused: core `RuntimeCatalog` ([AudioCppRuntimeCatalog](AudioCppRuntimeCatalog.md)),
`RuntimeInstaller` (AudioCppRuntimeInstaller, runs RuntimeInstallerContract) and
`BaseRuntimeServer` (AudioCppServer, runs BaseRuntimeServerContract).
`RuntimeDetector` does not fit: the voice picker needs a synchronous answer, so
[AudioCppInstallation](AudioCppInstallation.md) looks binaries up synchronously.
