# LlmTabPage

`core/llm-server/ui/js/page/LlmTabPage.js` (started by [entry.js](../entry.md))

The LLM tab page: installs the shared renderer library, builds the chat side
([ChatWiring](ChatWiring.md)) and the Setup side ([SetupWiring](SetupWiring.md)),
links them, and starts the [mode toggle](../mode/ModeToggle.md) and the
[preflight banner](../setup-ui/preflight/PreflightBanner.md).

## Methods

- `new LlmTabPage({ win?, doc?, api? })`: `api` defaults to `win.llmDiagAPI`.
- `start()` returns the page. Steps, in legacy script order:
  1. `ResonantTemplates.registerAll(ResonantRuntime.shared())`,
     `FoldMemory.install(doc)`, `SegmentedPicker.install(doc)`.
  2. Chat side: `LumaChatExt.install(win)`, the core `scheduled-task` and
     `trigger` modes, ChatMode, CodeEditor.
  3. Setup side; the chat gets the Setup navigator as `setupNav`.
  4. `window.LumaChatMode = chatMode`.
  5. `SetupWiring.start()` (SetupMain, the music nav check, grounding, the Easy
     Setup button).
  6. `new ModeToggle({ chatMode, codeEditor, setupNav, api }).start()`.
  7. `new PreflightBanner({ api }).start()`.
- Fields: `chat` (ChatWiring), `setup` (SetupWiring), `modeToggle`, `preflight`.

## How the surfaces reach each other

| Who | Gets | Legacy global |
|---|---|---|
| ChatMode | `chatExt`, `voiceFactory` (the VoiceController class), `codeEditor`, `setupNav` | `LumaChatExt`, `LumaVoice`, `LumaCodeEditor`, `LumaSetupNav` |
| CodeEditor, TriggerCard | the ChatMode instance (`setChatMode`) | `LumaChatMode` |
| SetupMain | `modelList` (the ModelList class), `modelSearch`, `openers.image/music` | `LumaModelList`, `LumaModelSearch`, `__lumaImageSetupOpen`, `__lumaMusicSetupOpen` |
| MusicSetupPanel | `getChatExt` | `LumaChatExt` |
| ModeToggle | `chatMode`, `codeEditor`, `setupNav` | `LumaChatMode`, `LumaCodeEditor`, `LumaSetupNav` |

Window events still connect the rest: `luma-switch-mode` (chat, preflight,
wizard to the toggle), `luma-code-surface` and `luma-chat-tool` (chat to toggle
and editor), `luma-code-dock`, `luma-mode-changed`, `luma-models-changed`.

## Globals

Writes `window.LumaChatMode` (the ChatMode instance: e2e helpers call `show()`
and `openConversation(id)` on it). Reads `window.llmDiagAPI` (default `api`).
The classes it builds write `window.LumaChatExt` and `window.LumaSetupExt`.
