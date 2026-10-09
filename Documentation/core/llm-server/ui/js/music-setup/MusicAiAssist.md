# MusicAiAssist

`core/llm-server/ui/js/music-setup/MusicAiAssist.js`

Attaches the shared AI-fill buttons to the lyrics and style fields through the chat-extension `attachAssist` contract; this class only builds the requests (system prompt, user parts, temperature 0.9 / 0.8, 300 s timeout, noThink).

## Methods

- `MusicAiAssist.attach(lyricsEl, styleEl, chatExt, diag)` (false when the contract or `diag.chat.complete` is missing); `lyricsRequest({ lyrics, style })`; `styleRequest({ lyrics, style })`.

## Collaborators

`chatExt` is the `window.LumaChatExt` contract (ported by the chat-extension agent); it is passed in, not imported.

## Globals

None (the panel passes the contract in).
