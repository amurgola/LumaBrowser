# ReadmeShotsCli

`tools/docs/readme-shots/ReadmeShotsCli.js`

1. hides the notification log in the chrome and in the overlay pages that draw it above a tab (it names whatever
   the owner's accounts are doing, such as a signed-out workspace, and pops over any scene), forces
   `nativeTheme.themeSource = 'dark'` (a fresh profile follows the OS theme, and a light web tab beside the
   dark chrome looks wrong), sizes the window with [WindowCapture.resize](WindowCapture.md) (default 1600x1000 CSS
   px), makes sure one web tab sits beside the LLM tab (a fresh profile opens its home tab by itself; only when the
   strip has no web tab does it open `https://duckduckgo.com/`), brings the LLM tab to the front and picks a local
   model with [LocalModelPick](LocalModelPick.md);
2. runs the scenes in this order: [SetupScene](SetupScene.md) and [ModelFitScene](ModelFitScene.md) first, while
   no model server is running yet (so the Setup page has no "How your model is running" card), then
   [MediaScene](MediaScene.md), then [ChatScene](ChatScene.md), which loads the model, and last
   [DemoScene](DemoScene.md), which records a second question asked through the composer;
3. writes `llm-setup.png`, `media.png` and `chat.png` as whole-window captures
   ([WindowCapture.capture](WindowCapture.md)), `model-fit.png` as a page clip of the dialog and `demo.gif` as a
   recording ([DemoClip](DemoClip.md)), into `Documentation/images` by default.

`execute(argv)` resolves to the exit code: 0 done, 2 bad options (usage printed). Scene failures throw. The app is
closed and its temp dir removed in every case, except that `--keep` first waits for Ctrl+C (the app only lives as
long as this process). Options are parsed by [ShotOptions](ShotOptions.md).

Why a command and not a saved profile: the seed is whatever the owner has set up, so the pictures stay current with
the runtime, model and UI of the day, and the only state the screenshots depend on (no conversations, no restored
tabs, a local model) is created fresh each run.

## Methods

- `constructor({ log, rootDir })`: `log` defaults to `console.log`, `rootDir` to the repo root.
- `execute(argv)`: the command; returns the exit code.
- `_stage(launched, options)`: notices hidden, theme, window size, web tab, LLM tab in front, local model.
- `_muteNotices(app, shell)`: the style tag that hides `.notification-log`.
- `_scenes(launched, options)`: runs the selected scenes and writes their files.
- `_hold(launched)`: `--keep`; resolves on SIGINT or SIGTERM.
- `_window(app, outPath, options)`: one whole-window capture with a log line.
