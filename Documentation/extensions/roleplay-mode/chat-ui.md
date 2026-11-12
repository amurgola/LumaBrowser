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
  given, else a modal): three fields up front (the premise, "You": name,
  pronouns and one line of who you are, the writing tone with an AI assist) and
  the reply length (Snappy / Balanced / Lush), then a collapsed `More` section
  holding the art style, language model and context, base and edit image models
  (generation models vs edit or `supportsEdit` models, video excluded),
  characters (name, who they are, looks, a profile group: past, voice, wants, hides,
  tells, toward you; the art studio), scenes, options (images, prose polish,
  samplers off, image profile and relighting) and a pipeline-test button. A
  local LLM pick re-points the server via `api.setDefaults`. The result is
  normalised: ids and seeds minted, nameless rows dropped, each profile's
  `tells` line split and `bondUser` lifted into `bonds.user`, the protagonist
  trimmed, `lengthMode` defaulted, `imageProfile` and `harmonizeMode` defaulted
  (auto relights only on Quality), `artRevision` bumped when render settings
  change, active scene and `currentState` repaired, the memory (story record,
  chronicles, states, bonds learned in play) carried over from the previous
  save on an edit (the story timeline and `headId` too), then
  `RP_SHARED.migrateData`. A new world starts its timeline
  (`RP_TIMELINE.ensure`).
- `startConversation`: sends `(Begin the scene: set the stage and introduce the characters.)`.
- `onRestart`: wipes images, scene art, character art, wardrobe and the memory
  (story record, each character's chronicle and state, scene memories); keeps
  the definitions and profiles. "Clear story state" resets the memory the same
  way. Both start the story timeline over.
- `onOpenConversation`: every open of the thread (load, variant switch, removed
  turn) moves the head to the shown branch's newest point
  (`RP_TIMELINE.materialize` over `api.conv.messages`), stores it, and re-renders
  the roster, scene button and background (the thread once when the cast changed).
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
  progress placeholder re-asserted after a shell re-render; the reply's
  world-update line (`.rp-activity`: the running step, then a collapsed list of
  what the reply changed, or that it was stopped; live from `mode:activity`, else
  from the reply's timeline point); image and remove controls. User turns get a
  Remove control.
- `onChatEvent`: the server contract from
  [RoleplayExtension](RoleplayExtension.md): `mode:image-start`,
  `mode:progress`, `mode:image-stage`, `mode:image-fail`, `mode:image`,
  `mode:world` (adopted through `RP_TIMELINE.adoptHead`: head rows, story,
  `headId`, the reply's point), `mode:scene-art`, `mode:content` (a polished reply:
  the body re-renders from the new text) and `mode:activity`. World-phase
  `mode:progress` labels (`phase: 'world'`) go to the activity line, not the image
  placeholder. Removing a turn drops its timeline point (and calls
  `RP_SHARED.forgetTurn`); the refresh re-materializes the head.
- Page edits store through `saveWorld(ctx, data, how)`: `head` (scene switch,
  Wear an outfit, gallery removal) records the head into its point, `definitions`
  (Edit, character card) also syncs definitions to every point, `reset` (Restart,
  Clear story state) starts over, `assets` (image regeneration, Create image)
  only stores.

Model text reaches `innerHTML` only through `escHtml` (text positions) and the
small inline-markdown pass.

## Globals

Reads `window.LumaChatExt` (`registerMode`, `openSchemaModal`,
`openSchemaInline`, `generateImage`), `window.RP_SHARED`, `window.RP_TIMELINE`,
`window.llmDiagAPI.image.generateAbort`, `window.CSS`, `window.performance`.
Writes none (it registers through LumaChatExt).

## Changes (2026-11-09, helper model)

The setup's More section gains a `sideModel` select ("Bookkeeping model"): same as the story model, the app's helper model (Setup), or any listed model (`sideModelOptions`); helper rows never appear among the language models.

## Changes (2026-11-12, gear section)

The reply length options read as ceilings: Snappy (up to 90 words), Balanced
(up to 180 words), Lush (up to 320 words).

A new hook, `renderGear(pop, ctx, panel)`, fills the roleplay's section of the
composer gear ([GearPanel](../../core/llm-server/ui/js/chat/composer/GearPanel.md)),
which takes the place of the chat's attach, replies, browser and tool rows (a
roleplay turn never uses them; no `gearKeep`). Under a "Roleplay" heading
("applies from the next reply") it renders:

- Reply length, a select (`.rp-gear-length`) in a `.cm-gear-field` row.
- Tone, a text input (`.rp-gear-tone`), saved trimmed on change; Enter leaves
  the field.
- One checkbox per option (`input[data-option]`): `prosePolish`,
  `noSamplers`, `autoImage`, `sceneBackground`, `autoAvatarArt`.
- "Edit everything…" (`.rp-gear-edit`): closes the panel and opens the full
  settings dialog.

Each change is stored at once through `ctx.setMeta` and applies from the next reply. The settings live beside the story, not on its timeline, so no story point moves and the thread is not re-rendered.

## Verbose turn log (2026-11-12)

The setup options and the gear carry a "Verbose turn log" toggle
(`options.verboseLog`). Once a turn has been recorded the gear also shows
"Copy turn log path", which copies `data.turnLog.md`.

The setup options and the gear carry a "Narrator thinking" select (Brief, Off,
Full; `options.narratorThinking`).
