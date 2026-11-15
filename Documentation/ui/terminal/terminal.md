# Terminal page files

`ui/terminal/terminal.html`, `ui/terminal/terminal.css`, `ui/terminal/terminal.js`, `ui/terminal/terminal-icon.svg`

Served at `luma://terminal/` by [TerminalPage](../../core/terminal/TerminalPage.md). The HTML has a strict CSP (own
scripts, own and inline styles, which xterm.js needs) and loads xterm.js from `/vendor`. The CSS inlines the shell's
own tokens and is dark whatever the system prefers, like the app around it.

The script (`TerminalTabPage`) shows this tab's session in a [TerminalView](TerminalView.md) over
`window.lumaTerminal`, and:

- names the tab after the program's own title, else the profile and the folder (`PowerShell: project`);
- keeps profile and folder in the address with `history.replaceState`, so a restored tab reopens there;
- closes the tab when the shell ends cleanly (the user typed `exit`); a failure stays up to be read;
- shows a banner while an AI agent is using the terminal, with **Take over** (the agent can read but not type) and
  **Hand back**.
