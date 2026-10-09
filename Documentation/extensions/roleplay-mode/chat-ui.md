# chat-ui.js (classic)

`extensions/roleplay-mode/chat-ui.js`

Roleplay Mode's chat-page UI. Classic-script exception: roleplay-mode is
`distributable: true`, so its chat-UI entry stays one self-contained classic
file (the LLM tab loads it as a plain script from
`/llm-ui/ext/roleplay-mode/chat-ui.js`, the manifest's `chatUi.file`). It is
written to run as a module script too (it only reads and writes explicit
`window` globals).

## What it does

On load it adds `<link id="rp-css">` for `/llm-ui/ext/roleplay-mode/roleplay.css`
and `<script id="rp-shared">` for `/llm-ui/ext/roleplay-mode/shared.js` (see
[shared](shared.md); local fallbacks cover a failed load), then calls
`window.LumaChatExt.registerMode({ id: 'roleplay', ... })` with these hooks:

- `openSetup(api, ctx)`: the schema form (inline in `ctx.setupHost()` when
  given, else a modal): scenario, style, language model and context, base and
  edit image models (generation models vs edit or `supportsEdit` models,
  video excluded), characters (AI-assisted name, persona and art studio),
  scenes, options and a pipeline-test button. A local LLM pick re-points the
  server via `api.setDefaults`. The result is normalised: ids and seeds minted,
  nameless rows dropped, `imageProfile` and `harmonizeMode` defaulted (auto
  relights only on Quality), `artRevision` bumped when render settings change,
  active scene and `currentState` repaired, then `RP_SHARED.migrateData`.
- `startConversation`: sends `(Begin the scene: set the stage and introduce the characters.)`.
- `onRestart`: wipes images, scene art, character art and wardrobe; keeps the
  definitions.
- `applyTheme`: the current scene's art as the chat background when
  `options.sceneBackground`, else clears it.
- `decorateComposer`: Scene (switcher plus two-click "Clear story state"),
  Edit (settings modal), Gallery (all images; Wear an outfit, Remove), Create
  image (paint the moment with the base model, then match faces with the edit
  model), and the cast roster strip.
- `renderTurnExtras`: rebuilds an assistant body from raw content: narration
  paragraphs, `**Name:**` lines as avatar plus attributed text (quoted speech
  vs muted action, emotion avatar), mid-paragraph speaker split, stray tags
  unbolded, `<<<WORLD>>>` and ```` ```choices ```` blocks stripped; stored image;
  progress placeholder re-asserted after a shell re-render; image and remove
  controls. User turns get a Remove control.
- `onChatEvent`: the server contract from
  [RoleplayExtension](RoleplayExtension.md): `mode:image-start`,
  `mode:progress`, `mode:image-stage`, `mode:image-fail`, `mode:image`,
  `mode:world`, `mode:scene-art`.

Model text reaches `innerHTML` only through `escHtml` (text positions) and the
small inline-markdown pass.

## Globals

Reads `window.LumaChatExt` (`registerMode`, `openSchemaModal`,
`openSchemaInline`, `generateImage`), `window.RP_SHARED`,
`window.llmDiagAPI.image.generateAbort`, `window.CSS`, `window.performance`.
Writes none (it registers through LumaChatExt).
