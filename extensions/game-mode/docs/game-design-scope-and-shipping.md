# Game design: scope, build order and the shipping checklist

## Build the vertical slice, not the outline

A prototype answers "does this mechanic work?". A vertical slice answers "can this be a real
game?" by taking one small part all the way to finished quality: real input, real feedback, real
fail state, real UI. For a browser game built in one sitting, the vertical slice IS the game.

Wrong order (the usual failure): menus, settings, five scenes, an inventory, and a title screen,
with a core loop that was never fun. Right order: the loop, then the feel, then the shape.

## Build order that always works

1. **Playable in one scene.** Player, one input, one obstacle, movement on screen. No menu, no art.
2. **Win and lose.** A goal that can be reached and a way to fail. The game is now a game.
3. **Feel pass.** Feedback on every action: tween, flash, shake, sound, score pop. This is where
   a dull prototype becomes fun, and it costs less than any other step.
4. **Escalation.** Difficulty rises with time or level. Something new by second 60.
5. **Session shape.** Title, game over with score and best, restart in one key, pause.
6. **Content.** More levels, enemies, upgrades, using systems that already work.
7. **Art and polish.** Generated assets replacing placeholders, transitions, particles.

Never spend generation time on art for a mechanic that is not proven. Placeholder rectangles with
good feel beat beautiful sprites with bad feel every time.

## Scope rules for a session-sized game

- One core mechanic, one genre, one art style.
- Three to five source files before it is playable; grow from there.
- Content that reuses systems (more waves, more levels of the same kind) is cheap. Content that
  needs new systems (an inventory, dialogue, a save editor) is expensive. Prefer cheap content.
- If a feature does not change what the player does in the next ten seconds, it is not in the
  first build.
- Cut scope, not quality. A small game that feels finished reads far better than a large game
  that feels broken.

## What to do when the user asks for something huge

Do not refuse and do not silently shrink it. Name the smallest version that still expresses the
idea, build that end to end, then extend it in the same conversation. An MMO request becomes a
single-screen arena with bots first, and the multiplayer relay after it plays well.

## Playtest questions (ask the user these, not "is it good?")

After each build, the user is the only fun-detector available. Ask specific, answerable questions:
- Did you understand what to do without being told?
- Where did you die, and did it feel fair?
- What did you want to do that the game would not let you?
- At what point did you get bored, and what were you doing then?
- Which part felt best?

Then change one system at a time so the next answer means something.

## Shipping checklist (before saying the game is ready)

Mechanics
- The core loop runs start to finish without touching the console.
- Win and lose states both trigger and both lead back into play in one input.
- Difficulty rises; a skilled player and a new player have visibly different runs.
- No softlock: every state has an exit, including "stuck in geometry" and "no moves left".

Feel and clarity
- Every player action has a visible reaction.
- The objective is visible or obvious within the first five seconds.
- The HUD shows score/health/objective and nothing dead.
- Camera and colours keep the player and the threats readable at all times.

Technical (this project)
- Every src file appears in index.html in dependency order, with src/main.js last.
- run_game reports no runtime errors, a canvas mounted, and no failed asset loads.
- Assets load by relative path from assets/, sized to what the game actually uses.
- State saves and loads (best score at minimum) without throwing when localStorage is empty.
- The game pauses or tolerates losing window focus, and does not depend on frame rate.

Only after all of that: tell the user to press Play, say what changed, and ask what to tune next.
