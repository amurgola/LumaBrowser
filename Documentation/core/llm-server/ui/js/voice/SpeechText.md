# SpeechText

`core/llm-server/ui/js/voice/SpeechText.js`

Turns chat markdown into speakable text and sentence-sized synth requests.
Typography the TTS lexicon cannot voice is normalised (curly quotes, en and em
dashes to a comma pause, the ellipsis character) and arrows, dingbats and emoji
are silenced; the special characters are built from code points.

## Methods

- `clean(text)`: drops table rows, code ticks, emphasis markers, headings,
  bullets, link targets and URL schemes.
- `splitSentences(text)`: `{ chunks, rest }`; boundaries are `.`, `!`, `?`
  (with trailing quotes or brackets) or blank lines; fragments under 24
  characters merge forward.
- `speakableChunks(text)`: a committed reply without `<think>` (closed or
  open), `<tool_call>` envelopes or fenced code; `[]` when nothing is readable.
