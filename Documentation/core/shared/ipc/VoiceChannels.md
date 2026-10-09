# VoiceChannels

`core/shared/ipc/VoiceChannels.js`

The IPC channel names shared by the speech-to-text and text-to-speech halves of
voice conversation mode.

## Constants

- `VoiceChannels.VOICE_EVENT_CHANNEL` = `'core.voiceServer.event'`: setup
  progress (runtime install, model download) for both halves.
- `VoiceChannels.TTS_STREAM_CHANNEL` = `'core.voiceServer.ttsEvent'`: synthesis
  PCM stream, TTS only.

The class is frozen.

## Why

Both halves send setup progress on one channel. If each declared the string, a
rename in one would silently split the stream: no error, the renderer just
stops seeing half the events. It is its own class rather than living in either
handler file, so neither half depends on the other's internals.

The LLM tab and On Demand preloads are unsandboxed, so they require this class
too ([VoiceApi](../../llm-server/preload/VoiceApi.md), [OnDemandPreloadApi](../../on-demand/preload/OnDemandPreloadApi.md));
it must therefore ship as plain JS.
