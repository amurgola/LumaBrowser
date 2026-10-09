# SpeechText

`core/on-demand/ui/voice/SpeechText.js`

`SpeechText.clean(s)`: what TTS should say. Drops table rows, code ticks,
emphasis marks, headings, bullets, link targets and URL schemes; typographic
quotes become plain, en and em dashes become ", ", the ellipsis "...", arrows,
symbols and emoji spaces; whitespace collapses.

The special characters are built with `String.fromCharCode` (the source holds none).
