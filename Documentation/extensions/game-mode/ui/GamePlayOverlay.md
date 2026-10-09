# GamePlayOverlay

`extensions/game-mode/ui/GamePlayOverlay.js`

The play overlay (`.gm-play`, body-mounted, tagged `data-cm-overlay`): a
toolbar (Back to chat, title, AI pill, Reload, Pop out) over a sandboxed
`iframe.gm-frame` (`sandbox` = `SANDBOX`, `referrerpolicy="no-referrer"`).

## Methods

- `new GamePlayOverlay({ playUrl, onPopOut })`: `playUrl(bust)` gives the
  game URL; `onPopOut` runs for the toolbar's Pop out.
- `listen(win)`: a `message` listener that mirrors
  `{ type: 'luma-ai-status', online, pending }` into the pill, only from this
  overlay's own frame.
- `show(title, ai)`: builds the overlay once, sets the title (default `Game`),
  shows the pill as `AI ready` for AI games (else hides it), loads
  `playUrl(true)` and focuses the frame after 50 ms (keyboard games).
- `hide()`: hides the overlay and blanks the frame, stopping the game loop and audio.
- `setAiPill(st)`: `AI offline` (`gm-ai-off`), `AI thinking` /
  `AI thinking (n)` (`gm-ai-busy`) or `AI ready`; `null` hides it.
- Reload sets `playUrl(true)` again and focuses the frame.

## Globals

Reads `document`; listens for `message` on the window passed to `listen`.
