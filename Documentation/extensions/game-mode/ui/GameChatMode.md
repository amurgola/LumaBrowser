# GameChatMode

`extensions/game-mode/ui/GameChatMode.js`

Game mode's client side on the LLM chat page. It links `game.css`, registers
the `game` mode's hooks with the chat-extension registry and drives the
[status card](GameStatusPanel.md) and the [play overlay](GamePlayOverlay.md)
from the active conversation id and the latest game snapshot.

## Methods

- `register(registry, win)`: links `/llm-ui/ext/game-mode/game.css` once
  (`<link id="gm-styles">`; the loader serves declared assets but does not link
  them), starts the overlay's `message` listener on `win`, then
  `registry.registerMode(hooks())`.
- `hooks()`: `{ id: 'game', openSetup, startConversation, onOpenConversation,
  applyTheme, onLeaveConversation, onChatEvent }`, arrow functions because the
  chat shell calls them on the registry's merged object.
  - `openSetup(api, ctx)`: fetches the image models, builds the
    [setup schema](GameSetupSchema.md) and preselected pins, and opens
    `registry.openSchemaInline(schema, { api, host, initial })` when
    `ctx.setupHost()` gives a host, else `openSchemaModal(schema, { api, initial })`.
  - `startConversation(api, ctx, data)`: adopts `ctx.conversationId` and
    sends the [kickoff turn](GameKickoff.md) through `ctx.sendTurn` (errors ignored).
  - `onOpenConversation(meta, ctx)`: the snapshot becomes `meta.data.game`
    (or none), then renders.
  - `applyTheme(rootEl, meta, ctx)`: renders, keeping the last snapshot when
    the meta has no game block.
  - `onLeaveConversation()`: hides the overlay and clears the card.
  - `onChatEvent(evt, ctx)`: on `game:state` only, the payload becomes the
    snapshot and the card re-renders.
- `showPlay()`: opens the overlay with the game's name (AI pill for AI games);
  nothing without a conversation.
- `popOut()`: `POST /api/ext/game-mode/open-tab/<convId>`; on any failure
  `window.open(playUrl)`, which the shell turns into a tab.

Card buttons: Play, Pop out, Export zip, Share link / New game
([GamePanelActions](GamePanelActions.md)) and the collapse toggle (kept for
the sitting).

## Globals

Reads `window.LumaChatExt` (passed in by the entry), `document`, `location`,
`window.open`; listens for `message` on the window.
