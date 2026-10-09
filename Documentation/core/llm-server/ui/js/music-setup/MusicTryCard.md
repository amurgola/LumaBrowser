# MusicTryCard

`core/llm-server/ui/js/music-setup/MusicTryCard.js`

The Music "Try it" card: lyrics and style with AI drafting, Generate and Cancel, the status line ("Loading model…", "Switching model…", "Composing… Ns", "Failed: …") and an audio player for the returned WAV. Built once, then patched, so typed lyrics survive repaints.

## Methods

- `paint()`; `startGeneration()`; `MusicTryCard.statusText(busy, genState)`.

## Globals

Uses `URL.createObjectURL` / `revokeObjectURL`, `atob`, `Blob`.
