# Game design: onboarding, the first sixty seconds, HUD and readability

A browser game gets a handful of seconds to earn attention. The opening is a design problem, not
a text problem.

## Get to fun in five seconds

- The player should be controlling something within 5 seconds of the page loading. A title screen
  is fine only if one key starts the game immediately (and the key is stated on screen).
- No cutscene, no lore wall, no multi-page tutorial in a small game.
- The default state of the game is *playable*. If a menu exists, it takes one input to leave.

## Teach through the level, not through text

The proven pattern (Nintendo's method) is to introduce each mechanic in three escalating beats:

1. **Safe introduction.** The mechanic appears where failure is impossible. A single gap to jump,
   one enemy that cannot reach you, a switch alone in a room.
2. **Application.** The same mechanic under mild pressure: a gap with a moving hazard, two
   enemies, a timed switch.
3. **Twist or combination.** The mechanic combined with something already learned, or inverted.

Support this with environmental nudges rather than instructions: put the player on the left so
they move right, put a collectible above a platform to teach jump height, place the first enemy
where jumping over it is the obvious answer, light or color the path forward.

Where a control genuinely must be stated, state it in three words on screen, in the moment it is
needed ("SPACE to jump"), and let it fade. Never open with a control list of six lines.

## Clarity rules that prevent "I don't understand this game"

- **One new idea at a time.** Never introduce two mechanics in the same 20 seconds.
- **Name the goal on screen.** A visible objective ("Reach the flag", "Survive 60s", "Score 500")
  removes the most common source of confusion.
- **Every interactive object looks different from every decorative object.** Consistent color or
  outline for "this affects you".
- **Immediate feedback on every input.** If a key does nothing visible, players assume it is
  broken. Even a rejected action deserves a shake or a sound.
- **Feedback on every state change.** Health lost, score gained, level cleared, upgrade acquired:
  each needs a visible reaction the same frame.

## HUD and UI

- Show only what changes decisions: score, lives/health, timer, objective, current power-up.
  Anything else is decoration and costs readability.
- Pin the HUD with `setScrollFactor(0)` and keep it out of the play area (top corners), never
  under the player's usual path.
- High contrast: white or bright text with a dark stroke (`setStroke('#000', 4)`) survives any
  background.
- Animate numbers when they change (scale pop 1.0 to 1.25 and back over 90 ms) so the player
  notices without looking away from the action.
- Build these once in `src/ui/` (Button, HUD, DialogBox) and reuse, so menus, pause, and game
  over all look like the same game.

## Required screens for a finished-feeling game

Even a tiny game feels complete with these four states, and unfinished without them:

1. **Title / start**: game name, one-line pitch or control hint, "Press SPACE to play".
2. **Play**: the loop with a live HUD.
3. **Pause** (P or ESC): a dim overlay, resume and restart. Cheap and it signals polish.
4. **Game over / results**: score, best score, cause of death if relevant, one-key restart.

Add transitions between them (`cam.fade`, a short tween) so state changes read as intentional.

## Accessibility basics worth the ten minutes

- Support both arrows and WASD; support mouse or touch input where the design allows it.
- Never rely on color alone to distinguish a threat from a reward: use shape or motion too.
- Avoid full-screen strobing; keep camera shake short (under 200 ms) and modest.
- Pause when the window loses focus, and make sure the game does not eat browser shortcuts.
