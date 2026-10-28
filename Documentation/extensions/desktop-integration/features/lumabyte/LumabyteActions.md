# LumabyteActions

`extensions/desktop-integration/features/lumabyte/LumabyteActions.js`

Lumabyte acting on its window through desktop control (`global.__lumaDesktop`,
[DesktopService](../../../../core/desktop/DesktopService.md)), always on the
attached window. Desktop control's switch ("Allow desktop control" in the LLM
tab) and its guards (UAC and sign-in prompts, covered elements) apply as they
do for the agent tools. A `read` needs no desktop control: it goes to
[LumabyteFiles](LumabyteFiles.md), and its output goes back to the model with
the next look.

The model asks for actions with a block alone in its reply:

````
```actions
{"actions":[{"type":"click","ref":12,"double":true}],"say":"Opening the out folder"}
```
````

- Types: `click { ref | description, double?, button? }`, `type { text, ref?, submit? }`,
  `key { keys }`, `scroll { direction, amount? }` (`DESKTOP_TYPES`), and
  `read { path }` (a file's text or a folder's list). Refs are the `[n]` numbers in
  the window text desktop control reads (`observe`), so a click by ref finds the
  same element.
- `static parse(text, { types })` -> `{ actions, say }` or null; actions whose
  type is not in `types` (default all) are dropped. Also accepts a ```json
  fence or a bare JSON object, and the shapes models improvise
  (`double_click`, `right_click`, `press_key`, a `target: { role, name }`
  turned into a description; `read_file`, `list_folder` and similar as `read`).
- `unavailableReason()`: null, or why not (desktop control off or missing).
- `observe(hwnd)`: the numbered elements, or null.
- `canRead()`, `folderOf(hwnd, { exe, title })`: whether reads are possible, and
  the folder open in File Explorer (null otherwise).
- `run(hwnd, actions, onStep, { folder, max })`: up to `max` (`cap(max)`: a
  whole number from 1, else `MAX_ACTIONS`, 12) in order,
  `SETTLE_MS` (700) after each window action, stopping at the first failure;
  reads resolve names against `folder` and carry their `output`; `onStep({ index, text, state })`
  with `run`, then `done` or `fail`.
- `static describe(action)` (the step line), `static report(results)` (what the
  next look tells the model), `static outputs(results)` (what the reads returned).
