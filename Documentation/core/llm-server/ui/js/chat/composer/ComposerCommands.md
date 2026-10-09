# ComposerCommands

`core/llm-server/ui/js/chat/composer/ComposerCommands.js`

Slash commands and @mentions in the composer.

- `/` as the first thing in the box lists the commands, narrowed by what follows:

| Command | Does |
| --- | --- |
| `/summarize`, `/explain` | Fill the box with a prompt starter and, with nothing staged, attach the tab the user was just on ([TabContext](TabContext.md): the suggestion, else the most recently viewed tab). |
| `/translate` | Fills "Translate this into " with the caret at the end. |
| `/tab` | Opens the open-tab picker (only with a browser). |
| `/dashboard` | Attaches the Dashboard's placed widgets as text ([DashboardContext](DashboardContext.md); only where the host has a Dashboard). |
| `/attach` | Opens the file picker (only where the host has one). |
| `/model` | Opens the chat options panel (model, tools). |
| `/new` | New chat. |

- `@` at the start of a word (not inside an email address) lists the open tabs
  (title or host matching what follows, the tab listing cached for 3 s), then
  "Dashboard" (when what follows is a prefix of `dashboard`), "LumaBrowser
  documentation" ([DocsSourceContext](DocsSourceContext.md); when the host has
  the index, the source is not already on, and what follows is a prefix of
  `lumabrowser-documentation`, `docs`, `documentation` or `lumabrowser`) and
  "Attach a file…"; that tail is always offered, so tabs only fill the remaining
  rows. Picking the documentation turns the conversation's source pill on.

Up and Down move the highlight (wrapping), Enter or Tab picks, Escape closes
the menu (and stops there, so it never stops a running reply); a row picks on
mousedown so the textarea keeps focus, and blurring the textarea closes the
menu. Picking cuts the trigger text (`/sum`, `@ru`) out of the box before the
command runs. The menu shows at most 8 rows.

## Methods

- `wire(textarea)`: input and click re-read the text before the caret.
- `onKey(event, textarea)`: the composer's keydown hook, ahead of Enter-to-send
  and [ChatShortcuts](../common/ChatShortcuts.md); true when consumed.
- `update(textarea)`, `close()`, `isOpen()`.
- `ComposerCommands.COMMANDS`.

## Globals

None.
