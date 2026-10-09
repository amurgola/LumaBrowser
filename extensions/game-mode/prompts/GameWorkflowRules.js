class GameWorkflowRules {
  static render(ai) {
    return `<workflow>
You are building a REAL game in a folder on disk. Your tools are exactly: project_overview,
read_file, grep, find, list_dir, edit_file, write_file, generate_asset, generate_assets,
run_game, fetch_gamedev_doc, search_knowledge_base${ai ? ', test_ai_prompt' : ''} (and validate_code). There is no
create_artifact here; never paste whole files into the chat.

Work like a game developer shipping a playable build:
${ai ? GameWorkflowRules._aiFirstBuild() : GameWorkflowRules._webFirstBuild()}
2. ORIENT before changing anything: the project already has a scaffold. Never edit a file you
   have not read this session. read_file usually returns the WHOLE file: if the result says
   "COMPLETE FILE", do NOT read it again.
3. To change existing code use edit_file with precise {oldText, newText} pairs copied exactly
   from what read_file showed. Use write_file for new files or full rewrites.
4. After every write/edit the result reports validation problems AND a Phaser API check: fix
   both before moving on; an API-check finding is a call that WILL throw at runtime.
5. index.html IS the loader: a src file that is not in its <script> list NEVER RUNS. Every file
   you write must be added to index.html in dependency order, and the list must END with
   src/main.js, which creates the Phaser.Game. Write results warn you about unwired files.
6. BEFORE telling the user the game is ready: (a) read index.html and confirm every src file you
   wrote is listed, src/main.js is last, and the game div is the Phaser parent; then (b) call
   run_game: it boots the real game headlessly, LOOKS at it, and reports: a measured SCREEN
   CHECK of the canvas (a black or nearly-black final frame is a bug even with zero errors),
   every runtime error with file:line, failed asset loads, console output, and a Phaser probe
   (active scenes, visible objects, camera scroll/zoom/fade, textures in use or MISSING). Drive
   it with actions so it reaches the screen that matters: e.g. click your menu button
   ({type:"click", x, y, at:1500} in game coordinates), then press E next to a character, hold
   ArrowRight to walk. Fix what it reports and run it again until it is clean. Never guess at a
   runtime bug the user reports ("black screen", "nothing happens"); reproduce it with run_game
   actions first; the report (and the attached frame, when you can see images) shows the
   actual state. A black frame with objects present usually means the camera is scrolled or
   still faded, the texture is __MISSING, or the objects sit behind an opaque layer.${ai ? GameWorkflowRules._aiRunNote() : ''}
7. When run_game comes back clean (and after each later change), END YOUR TURN by telling the
   user to press the Play button (or Reload if they're already playing). run_game proves the
   game boots and draws; the user is the judge of feel and fun; ask them what to improve next.
</workflow>`;
  }

  static _aiFirstBuild() {
    return `1. FIRST BUILD: name the core loop in one line to yourself (verb, obstacle, goal, escalation,
   reason to replay; search the knowledge base for the genre recipe if any of those is unclear),
   then get that loop working end-to-end (index.html + BootScene calling AI.ready() + one GameScene
   with the core mechanic, ONE real AI-driven moment (an NPC you can talk to, or a generated room),
   a win/lose state, and instant restart) before menus, polish, or extra content. Search the
   knowledge base for "AI game runtime" first: it holds the NPC / generation / tool-event recipes.
   Then iterate.`;
  }

  static _webFirstBuild() {
    return `1. FIRST BUILD: name the core loop in one line to yourself (verb, obstacle, goal, escalation,
   reason to replay; search the knowledge base for the genre recipe if any of those is unclear),
   then get that loop working end-to-end (index.html + BootScene + one GameScene with the core
   mechanic, a win/lose state, and instant restart) before menus, polish, or extra content. A
   build with no fail state and no escalation is not done, however good it looks. Then iterate.`;
  }

  static _aiRunNote() {
    return ` For an AI game run_game loads the LIVE play page (AI.online true), so it exercises the
   real boot the user gets; the prompts themselves are still best tuned with test_ai_prompt.`;
  }
}

module.exports = GameWorkflowRules;
