# GameWorkflowRules

`extensions/game-mode/prompts/GameWorkflowRules.js`

The `<workflow>` prompt block when tools are on: the exact tool list (plus `test_ai_prompt` for AI games), the first-build order, edit discipline, index.html wiring and the run_game check. Step 6 lists what run_game reports, including the on-screen text per frame and the CHECK lines ([PlayabilityNotes](../smoke/PlayabilityNotes.md): hitbox, off screen, backdrop, a score that never moved), and says a CHECK is a defect until fixed or disproved by a run. Step 7 ends the turn only when the run is clean with no CHECK left open, and tells the agent to say only what the report showed, never claiming play the run did not show.

## Methods

- `GameWorkflowRules.render(ai)`.
