# GameChatMode

`extensions/game-mode/ui/GameChatMode.js`

Game mode's client side on the LLM chat page. It links `game.css`, registers
the `game` mode's hooks with the chat-extension registry and drives the
[strip above the composer](GameStrip.md) and the [play overlay](GamePlayOverlay.md)
from the active conversation id and the latest game snapshot.

## Methods

- `register(registry, win)`: links `/llm-ui/ext/game-mode/game.css` once
  (`<link id="gm-styles">`; the loader serves declared assets but does not link
  them), starts the overlay's `message` listener on `win`, then
  `registry.registerMode(hooks())`.
- `hooks()`: `{ id: 'game', openSetup, startConversation, decorateComposer,
  onOpenConversation, applyTheme, onLeaveConversation, onChatEvent,
  onModelPicked }`, arrow functions because the chat shell calls them on the
  registry's merged object.
  - `openSetup(api, ctx)`: fetches the image models and the
    [language model choices](GameLanguageModel.md), builds the
    [setup schema](GameSetupSchema.md) and preselected pins, and opens
    `registry.openSchemaInline(schema, { api, host, initial })` when
    `ctx.setupHost()` gives a host, else `openSchemaModal(schema, { api, initial })`.
  - `startConversation(api, ctx, data)`: adopts `ctx.conversationId`, applies
    a local `data.llmModel` pick (awaited, so the first turn does not start on
    one model and move to another), then sends the [kickoff turn](GameKickoff.md)
    through `ctx.sendTurn` (errors ignored).
  - `decorateComposer(els, ctx)`: attaches the strip to `els.bar`. The chat
    calls it when a game conversation opens or starts.
  - `onOpenConversation(meta, ctx)`: the snapshot becomes `meta.data.game`
    (or none) and renders; the host is then asked for the current state.
  - `applyTheme(rootEl, meta, ctx)`: renders, keeping the last snapshot when
    the meta has no game block.
  - `onLeaveConversation()`: forgets the conversation and its snapshot, hides
    the overlay and takes the strip down.
  - `onChatEvent(evt, ctx)`: on `game:state` the payload becomes the snapshot
    and the strip repaints; any other mode event only puts the strip back when
    the composer bar was rebuilt under it.
  - `onModelPicked(ref, ctx)`: `GameLanguageModel.record`, so a pick in the
    gear's Model row becomes the game's model.
- `showPlay()`: opens the overlay with the game's name (AI pill for AI games);
  nothing without a conversation.
- `popOut()`: `POST /api/ext/game-mode/open-tab/<convId>`; on any failure
  `window.open(playUrl)`, which the shell turns into a tab.

Strip buttons: Play, Pop out, Export zip, Share link / New game
([GameStripActions](GameStripActions.md)); the fold toggle belongs to the strip.

## Keeping the strip current

A `game:state` chat event only arrives while a turn runs, and art renders are
background tasks that can end after it. So:

- the first hook that hands over an `api` subscribes once to
  `api.onConvJobsEvent`; a `finished` job of the open game conversation makes
  the mode fetch [GameServerApi.state](GameServerApi.md) and render it;
- opening a game conversation fetches the state once, since the stored meta
  snapshot can be older than what finished since.

A fetch that fails, returns no game, or resolves after the conversation was
left changes nothing.

## Globals

Reads `window.LumaChatExt` (passed in by the entry), `document`, `location`,
`window.open`, `fetch`; listens for `message` on the window.
