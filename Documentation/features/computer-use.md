# Computer use that stays on your machine

## Desktop control (Windows)

- The agent sees and operates other apps, accessibility tree first and vision
  second, with a small local grounding model finding what the tree does not
  list.
- No per-step cost: a long task is free to run as long as it needs.
- Screenshots never leave the machine, and a window is captured on its own,
  never the whole screen with whatever else is open.
- It works inside your own logged-in apps and browser profile, so there is no
  second login and no bot check for being a headless browser.
- Clicks land where they should on 4K, high-DPI and multi-monitor setups:
  everything is measured in physical pixels and mapped back per window.

## Staying in control

- **Ctrl+Alt+Shift** in any app: the screen edge lights the window the agent
  is working on and the island says what it is doing.
- Ctrl+Alt+Shift+Space pauses or continues, Ctrl+Alt+Shift+Esc stops, and
  Ctrl+Alt+Shift+Y and N answer its approvals. All can be rebound.
- Approvals can be granted once, for the chat, or for one window only.
- Typing into a password field, or acting in a checkout, payment or banking
  window, always asks first. Unattended runs refuse them.
- When it meets a sign-in, a CAPTCHA or a bot check, the agent stops and hands
  the window to you.

## Terminal

- A real terminal inside the browser, on Windows, macOS and Linux: PowerShell, Command Prompt, Git Bash and WSL on
  Windows, your login shell elsewhere. Ctrl+Shift+backtick opens one as a tab; it lives in the tab strip like any
  page, keeps its folder across restarts and gives the shell its usual keys (Ctrl+R, Ctrl+W, Ctrl+L).
- Ctrl+backtick opens a terminal under the page you are on, the way the chat panel does. It belongs to that tab:
  it steps aside when you switch to another tab or to the LLM tab and is back, still running, when you return.
  Programs in it can read which tab they sit under, and `luma` started there works on that page: "go to reddit.com"
  navigates the tab above it.
- Command-line apps you have installed (Claude Code, Codex, Gemini CLI and others) appear as one-click terminals, and
  extensions can add their own.
- With **Let AI use the terminal** switched on (it is off by default), the assistant and MCP clients can open a
  terminal, run commands, answer prompts and drive full-screen programs in a session that keeps its state. You watch
  it in a tab, **Take over** stops it typing at any time, risky commands always ask, and the terminal is never
  offered to people you share your models with.

## Window tabs (Windows)

Ctrl+Alt+Shift+T opens any desktop window as a live tab.

- The tab shows a live picture of the window, and a Text panel shows its
  accessible text. The chat can read it like any other tab.
- A Control switch passes your clicks and typing through to the real window.
- Because it is an ordinary tab, Tab Share can stream it.

## Android devices

Run an Android device in a tab and use its apps next to your pages.

- Needs the Android SDK on your computer (Android Studio installs it) with the emulator and a system image.
  **Settings > Android** lists your devices and can make a new one.
- **Open** shows the device in a tab: click and drag to touch, type on your keyboard, scroll with the wheel. The
  device's screen takes the size of the tab.
- It is an ordinary tab, so you can keep it. A kept tab keeps its device running, and after a restart the
  device is back in a few seconds from its saved state.
- Notifications the device raises go to the Hub.
- The assistant and MCP clients can see and drive a device with the `android_*` tools (list, start, read the
  screen, screenshot, tap, type, swipe, open an app, read notifications). A chat asks before each action that
  changes something, **Let AI use Android devices** switches the tools off, and they are never offered to people
  you share your models with.

## Lumabyte (Windows)

Ctrl+Alt+Shift+A docks a chat panel to any app window, one thread per app. It
can act inside that window when desktop control is allowed.

## System-wide hotkeys

Read the selection aloud, rewrite it, or send the clipboard or a screen region
to chat. On Windows, macOS (needs the Accessibility permission) and Linux.

- **Dictate anywhere:** press Ctrl+Alt+Shift+D in any app, speak, and press it
  again: what you said is typed into the text box you are in, in LumaBrowser
  or any other program. It uses the speech recognition model on your machine,
  so nothing you say leaves it. Once speech recognition is set up, the key or
  combination is yours to choose under Settings > General > Dictation.

## Desktop Integration API

A token-protected local API at `/api/desktop` for Windhawk mods, AutoHotkey,
PowerToys and scripts.

- Ask about a window, run file actions (describe, summarize, read aloud, add
  to a knowledge base), list running jobs, and get a one-line glance of your
  day.
- Discovery file at `%USERPROFILE%\.lumabrowser\desktop.json`.
- Six optional Windhawk mods install from Settings, such as "Ask Luma about
  this window" in every window's menu and a Luma submenu in Explorer.
