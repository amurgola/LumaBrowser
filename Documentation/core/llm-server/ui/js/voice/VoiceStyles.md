# VoiceStyles

`core/llm-server/ui/js/voice/VoiceStyles.js`

The voice controls' styles (mic states, popovers, meter, transcript strip),
injected once as `<style id="cm-voice-styles">`; kept in JS because the PWA and
the LLM tab both use the controller.

## Methods

- `VoiceStyles.ensure(doc?)`; `VoiceStyles.CSS` (identical rules to legacy).
