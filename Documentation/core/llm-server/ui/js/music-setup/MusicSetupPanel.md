# MusicSetupPanel

`core/llm-server/ui/js/music-setup/MusicSetupPanel.js`

The Music section of the LLM tab's Setup view (cards `cardMusicRuntime`, `cardMusicModels`, `cardMusicDefaults`, `cardMusicTry`) for the managed SGLang-Omni server (WSL2-wrapped on Windows). Wires the runtime, model, generation and server events once, loads `getView()`, and paints the four cards.

## Methods

- `new MusicSetupPanel({ getApi?, getChatExt? })`: `getApi` returns llmDiagAPI (uses `.music` and, for AI drafting, `.chat.complete`); `getChatExt` returns the chat-extension contract (default `window.LumaChatExt`).
- `hideNavIfUnsupported(nav?)`: hides `#navMusic` on a Mac (CUDA only). The page entry calls it once at boot (legacy did it at script load).
- `open()`: without `music.getView` every card says "Music server is not available in this build."; the first call wires events; every call runs `refreshAll()`.
- `refreshAll()`, `refreshStatusOnly()`, `runtimeRow()`; state `view`, `installProgress`, `activeDl`, `genState`.

## Collaborators

The Setup view switcher (agent B1's `setup.js` port) calls `open()` when the Music view is shown (legacy: `window.__lumaMusicSetupOpen`).

## Globals

Reads `window.llmDiagAPI` and `window.LumaChatExt` (defaults), `navigator.platform`. Writes none.

## Notes

Bug fixed: the "Could not load music setup" line HTML-escaped the error and then set it as textContent, so an "&" showed as "&amp;amp;". It is now plain text (test "a load error shows the message as plain text").
