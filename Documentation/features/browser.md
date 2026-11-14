# Browser

LumaBrowser is a Chromium-based browser first. The AI parts work on the tabs,
logins and files you already have in it.

## Everyday browsing

- Tabs, history, bookmarks and downloads that persist across restarts.
- Private windows (Ctrl+Shift+N) on their own throwaway session, left out of
  history and session restore.
- Pinned tabs, tabs that drag out into their own window, and tab restore on
  restart.
- A new tab page with a search box and your most visited sites.
- A pop-up blocker, notification permission prompts, and per-site permissions
  (camera, microphone, notifications, pop-ups, cookies) behind the address bar
  lock.
- Address bar suggestions from open tabs and bookmarks.
- Full screen (F11), spelling suggestions in the context menu, and "Clear
  browsing data" (Ctrl+Shift+Del) by time range.
- A switch to make LumaBrowser the default browser. Links and local HTML files
  passed on the command line open in a tab of the running window.

## Ad blocking and Chrome extensions

- A built-in ad blocker (Ghostery engine) with a per-site switch.
- Chrome extensions from three places: a curated store of ones that work in
  Electron (Bitwarden, Dark Reader, SponsorBlock, React DevTools and more),
  any Chrome Web Store link or extension ID, or an unpacked folder.
- Each extension gets a toolbar button with its popup, plus update checks.

## Password manager and autofill

- Offers to save a sign-in or an address and fills it back. A key icon in the
  address bar lists the page's saved logins.
- Logins fill only on their own site (exact origin or the same registrable
  domain) and never on a plain HTTP page, so a lookalike page cannot receive
  one.
- The vault is sealed with the OS keychain (DPAPI, Keychain, secret service).
  An optional master password with auto-lock gates reveal, copy, edit, export
  and assistant use.
- Two-factor codes, a generated password on new-password fields, and CSV
  import from Chrome, Edge, Firefox and Bitwarden.
- An API keys panel holds tokens the assistant can use through
  `{{vault:name}}` placeholders.
- Assistant use is opt-in per item. The model sees names, sites and masked
  usernames, never a secret. LumaBrowser types the value in, each fill is
  confirmed by you, and every attempt lands in an audit log.

## Search palette (Shift Shift)

Tap Shift twice anywhere to search:

- Settings, by name or plain description, with each setting's current value
  shown beside it. A chosen setting opens where it lives and is highlighted.
- Conversations by title and full text, artifacts, open tabs, and browser
  commands with their shortcuts.
- "Dig deeper" (Tab) has the chat model answer from your settings, chats and
  the documentation, with citations you can open.

## Luma On Demand

A floating voice or text panel on any page that acts on the current tab.

## Dashboard and the Hub

- **Dashboard:** a grid of live widgets from chats and extensions.
- **Hub activity feed:** one feed for the chat, mail, calendar and task
  notices from your own signed-in tabs. It is background about your day, not
  an inbox: nothing is counted as unread and nothing needs clearing.
- **Contexts:** name the companies or areas of your life and say which tabs,
  calendars, trackers, domains and apps belong to each.
- **Summaries:** an optional card per context, written by a model you choose,
  that says what is going on and whether anyone is waiting on you. Off by
  default; plain rules fill the cards otherwise.
- **Focus widget:** the task you said you are working on, at most five things
  that need you, and the calendar event in progress and the next one.
- **People:** the Hub remembers who reaches you and every way they appear, so
  a chat name and a mail sender can be one person.
- **To task:** turn anything asked of you into a board task in one click.

## Extensions

Everything above the core is an extension. Write your own with a `manifest.js`
and a `main.js`, and add routes, MCP tools and UI. See
[core/shell/extensions](../core/shell/extensions/).
