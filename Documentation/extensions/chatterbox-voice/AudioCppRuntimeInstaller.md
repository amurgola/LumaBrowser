# AudioCppRuntimeInstaller

`extensions/chatterbox-voice/AudioCppRuntimeInstaller.js`

Core [RuntimeInstaller](../../core/shared/runtime/RuntimeInstaller.md) bound to
the audio.cpp catalog.

## Methods

- `new AudioCppRuntimeInstaller(catalog = AudioCppRuntimeCatalog.shared, seams = {})`
  with User-Agent `LumaBrowser-ChatterboxVoice`, kind `audio-inference`, noun
  `audio inference`. `seams` passes the base's test seams (`http`, `sysdeps`, `extractor`).
- Inherited: `installRuntime`, `uninstallRuntime`, `fetchLatestRelease`,
  `fetchLatestPrerelease`, `resolvePrerelease`.

Its test runs `RuntimeInstallerContract`.
