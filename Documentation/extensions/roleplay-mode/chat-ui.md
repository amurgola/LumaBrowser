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
  the roster and background (the thread once when the cast changed).
- `applyTheme`: the current scene's art as the chat background when
  `options.sceneBackground`, else clears it.
- `decorateComposer`: the cast roster strip. The scene switcher, Gallery,
  Create image, "Clear story state" and the settings entry are rows of the
  gear (`renderGear`, see the 2026-11-16 changes below).
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

## Changes (2026-11-14, add-on 1.2.3: page-side saves start from the stored story)

`storedData(ctx)` reads the story as stored right now (`api.conv.meta.get`, falling back to the page's copy), and `changeStored(ctx, how, apply)` applies one change to it and saves through `saveWorld`. The page-side changes made during play go through it: a gear setting (`saveGearSetting`), a removed turn (`removeTurn`), a scene picked in the gear's Scene row (the scene menu before 1.2.4), a redrawn or painted image; `clearStoryState` starts from the stored story too.

Why: the server's reaction writes the story after every reply, and the page's copy is only as new as the last `mode:world` it received. The chat page dropped every mode event that arrived after the reply's `done` (core [ChatEventRouter](../../core/llm-server/ui/js/chat/stream/ChatEventRouter.md), fixed the same day), so the copy stayed as it was when the conversation was opened, and these saves wrote that copy back whole: the ledger, the cast's states and the timeline points of every reply since were erased, and the narrator then worked from a world several turns old until the story state was cleared. With the core fix the copy keeps up; reading the store first keeps the saves right on an app that still drops the events, and in the moments between a reaction's save and its announcement.

## Changes (2026-11-14, the picked model, the head sync)

- `onModelPicked(ref, ctx)` (the core [ModelPicker](../../core/llm-server/ui/js/chat/composer/ModelPicker.md) hook): the model picked in the gear or the model menu is stored as the story's `llmModel` (through `changeStored`), which is what the narrator's turn is pinned to and what the bookkeeping calls follow. Returns the save's promise, or null without an open story or a ref. Before this the pick was ignored and the story kept answering from the model chosen at setup.
- `syncHeadWithThread` reads the stored story after it has read the thread and moves that, so a reopen right after a regeneration cannot write an older copy over what the new reply's reaction saved.

Checked in the running app (2026-11-14, isolated data folder, through the real composer): the world update showed under the reply while it ran and when it finished, without reopening; a reply-length change made afterwards kept the story's turn, events and timeline point; a second model picked in the gear became `llmModel` and wrote the next reply.

## Changes (2026-11-16, add-on 1.2.4: image models and the story's actions in the gear)

The composer no longer carries the Scene, Edit, Gallery and Create image buttons: `decorateComposer` only builds the cast roster, and everything else is in the gear (`renderRoleplayGear`), under the quick settings.

- **Media models** (`appendGearMediaModels`): a `.rp-gear-media` holder the core fills with the same rows a plain chat's gear has, through `panel.mediaModels(holder, binding)` ([GearPanel](../../core/llm-server/ui/js/chat/composer/GearPanel.md), [MediaModelChoice](../../core/llm-server/ui/js/chat/composer/MediaModelChoice.md)). The binding lists the Image and Image editor jobs and ties them to the story's `baseModel` and `editModel`, the two fields the image pipeline and the setup dialog already use, saved through `saveGearSetting`. Default stores an empty value, which lets the image server's own default draw. There is no Video row: a roleplay makes no video. An app older than the rows has no `panel.mediaModels` and shows none.
- **Story** (`appendGearStory`), a section of its own:
  - Scene, a select (`.rp-gear-scene`) of the story's scenes on the scene the story is in, shown once it has scenes. A pick goes through `switchScene` (a `head` change on the stored story, the background following when scene art is the chat background). It replaces the composer's scene button and its menu.
  - Gallery (`.rp-gear-gallery`): closes the panel and opens the gallery.
  - Create image (`.rp-gear-createimg`): closes the panel and paints the newest reply, whose turn shows the progress. With no reply yet the row says "No response yet" and the panel stays. `momentBusy` holds the label of the paint in flight, because the gear is rebuilt on every open: a reopened gear shows the row disabled with that label, and `createMomentImage` refuses a second paint while one runs.
  - Clear story state (`.rp-gear-clear`): the two-click fresh start that used to sit at the bottom of the scene menu (so it is now reachable before the story has a scene).
  - Edit everything… (`.rp-gear-edit`), as before; the composer's Edit button opened the same dialog.

`turnElOf(ctx, messageId)` finds the reply on screen for `createMomentImage`. Only the context of a chat event carries `turnElForMessage`; the one the gear and composer hooks get does not, so a paint started from a button found no turn: no progress under the reply, and the picture only showed after the thread was next re-rendered (the composer button had the same gap). The thread is asked by `data-msg-id` when the context has no lookup.

Removed: `showSceneMenu`, `ensureSceneButton` and their styles (`.rp-scene-btn`, `.rp-edit-btn`, `.rp-scene-item.active`).

An app from before the gear hook (2026-11-12) never calls `renderGear`, so on such an app this version of the add-on has no way to reach these actions; it needs the app that ships with it.
