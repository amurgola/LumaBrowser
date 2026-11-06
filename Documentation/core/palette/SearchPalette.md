# Search palette (Shift Shift)

`core/palette/` (feature overview)

One search box for the whole browser. Tap Shift twice, type what you are looking
for in your own words, and jump straight to it: a setting, a past conversation,
an artifact, an open tab or a browser command.

## Using it

- **Open it**: tap Shift twice quickly, anywhere in LumaBrowser: on a web page, in
  the chat tab, in Settings, on the new tab page or in the Luma On Demand panel.
  Just tap: holding Shift, typing a capital letter or using Shift in a shortcut
  never opens it. Tapping Shift twice again (or Escape) closes it.
- **What it searches**:
  - settings across the Settings window (every tab, including extension pages)
    and the LLM tab's Setup pages and the chat's Tune dialog, by their names and
    by plain descriptions of what they do ("make the chat remember more" finds
    Context length, "block popups" finds the site permissions list);
  - your conversations, by title and by the full text of every message;
  - artifacts (pages, documents, code, images, videos) by title, type and the
    chat they came from;
  - the open tabs of the current window, by title and address;
  - browser commands (new tab, reopen closed tab, history, downloads, zoom, print
    and more), each showing its keyboard shortcut.
  Small typos are forgiven and filler words like "how do I" are ignored.
- **Empty box**: shows the last 5 places you were in (conversations, artifacts,
  Settings tabs, Setup pages and settings you opened).
- **Open a result**: use the arrow keys and press Enter, or click. A setting opens
  where it lives (its tab or page is opened, collapsed sections expand) and the
  row is briefly highlighted. A conversation opens in the chat, an artifact opens
  in its conversation's side panel, a tab is switched to, a command runs.
- **Dig deeper**: when the results are not what you meant, press Tab or choose the
  last row, "Dig deeper". Your chat model answers the question using your
  settings, your past chats and the LumaBrowser documentation, with small link
  buttons that open the settings and conversations it mentions. "Continue in
  chat" carries the question to a new chat with the documentation source turned
  on. Dig deeper needs a chat model to be set up; without one it still lists the
  places that matched.
- **Escape** steps back: out of Dig deeper, then clears the box, then closes.
- **Turn the double tap off**: Settings > General > Browsing > "Search with Shift
  Shift" (settings key `core.palette.doubleShift`, on by default).
- **Private windows**: the palette shows a "Private window" badge.

## Developer guide

### Module map

| Module | Role |
|---|---|
| [DoubleShift](DoubleShift.md) | the double-tap detector, fed by main's `before-input-event` hooks |
| [PaletteService](PaletteService.md) | owns everything below; `global.__lumaPalette` |
| [PaletteView](PaletteView.md) | the overlay `WebContentsView` per window |
| [PaletteSearch](PaletteSearch.md) | runs the providers, orders groups, Recent |
| [PaletteMatcher](PaletteMatcher.md) | forgiving word scoring |
| providers: [SettingsProvider](providers/SettingsProvider.md), [ExtensionEntries](providers/ExtensionEntries.md), [ConversationProvider](providers/ConversationProvider.md), [ArtifactProvider](providers/ArtifactProvider.md), [TabProvider](providers/TabProvider.md), [ActionProvider](providers/ActionProvider.md) | one per result kind |
| catalogs: [ShellSettingsCatalog](catalog/ShellSettingsCatalog.md), [LlmSettingsCatalog](catalog/LlmSettingsCatalog.md), [ActionCatalog](catalog/ActionCatalog.md) | the declared settings and commands |
| [ConversationIndex](ConversationIndex.md) | FTS5 over chat messages |
| [RecentPlaces](RecentPlaces.md) | the `palette_recent` table |
| [PaletteOpener](PaletteOpener.md) | carries out a chosen row |
| [DigDeeper](DigDeeper.md) | the model answer over settings, chats and docs |
| [PaletteIpcHandlers](PaletteIpcHandlers.md) | `core.palette.*` |
| page: [palette.html / palette.css](ui/palette.md), [palette-preload](ui/palette-preload.md), [entry](ui/js/entry.md), [PaletteApp](ui/js/PaletteApp.md), [PaletteHtml](ui/js/PaletteHtml.md), [DigView](ui/js/DigView.md) | the palette page |
| [ShellPalette](../../ui/shell/palette/ShellPalette.md), [SettingsReveal](../../ui/shell/settings/SettingsReveal.md) | the chrome's side |
| [PaletteDeepLinks](../llm-server/ui/js/chat/PaletteDeepLinks.md) | the LLM tab's side |

### Data flow

1. Main's keyboard hooks feed `DoubleShift.shared`: tab pages
   ([TabPageEvents](../browser/tab-view/TabPageEvents.md), which covers web pages,
   the chat tab and the new tab page), the shell renderer
   ([WindowKeys](../../app/window/WindowKeys.md), so the Settings modal) and the On
   Demand panel ([OnDemandKeyboard](../on-demand/OnDemandKeyboard.md)).
2. A double tap sends `{ action: 'open-palette' }` on `tab-view:accelerator` to
   that window's chrome. [ChromeKeyboard](../../ui/shell/keyboard/ChromeKeyboard.md)
   hands it to ShellPalette, which hides any chrome overlay and invokes
   `core.palette.toggle`.
3. PaletteService shows the window's [PaletteView](PaletteView.md) (created and
   loaded on first use, kept hidden afterwards) and focuses it.
4. The page searches over `core.palette.search` as the user types and opens a
   row with `core.palette.open`. The palette hides first, then
   [PaletteOpener](PaletteOpener.md) acts: shell settings and commands go back to
   the chrome as `palette-reveal` / `palette-run` (SettingsReveal,
   AcceleratorActions); LLM tab settings, conversations and artifacts go through
   `LLMServerService` (`revealSetting`, `openConversation`, `openArtifact`), which
   switches the LLM tab's mode and sends `core.llmServer.palette` to
   PaletteDeepLinks.

### Catalogs and drift tests

Settings are declared, not scraped: each catalog entry has the UI label, a plain description, synonyms, a breadcrumb path and a `target` saying where it lives.

### Conversation index

`llm_messages_fts` is an FTS5 table over user and assistant messages in
settings.db, kept current by triggers on `llm_messages`. It is created and
backfilled lazily in one transaction, on the first search or 20 s after boot,
so boot never pays for it.

### Recent places

`palette_recent` in settings.db: one row per `(kind, ref)`, newest 100 kept.
Written through `core.palette.record` by the opener, the chrome (Settings tabs)
and the LLM tab (conversations, artifacts, Setup pages); read back by reference,
so deleted things drop out.

### IPC

| Channel | Caller |
|---|---|
| `core.palette.search`, `open`, `close`, `dig`, `digAbort`, `continueInChat` | the palette page only |
| `core.palette.toggle`, `getDoubleShift`, `setDoubleShift` | a window's browser chrome only |
| `core.palette.record` | the browser chrome or an internal tab (the LLM tab), never a website |
| `core.palette.digEvent` | main to the palette page (Dig deeper stream) |
| `palette:show`, `palette:hidden` | main to the palette page |
| `core.llmServer.palette` | main to the LLM tab: `{ type: 'reveal', target }` or `{ type: 'artifact', conversationId, artifactId }` |

### Adding a setting

Add the control as usual, then an entry to
[ShellSettingsCatalog](catalog/ShellSettingsCatalog.md) (Settings modal) or
[LlmSettingsCatalog](catalog/LlmSettingsCatalog.md) (LLM tab Setup or Tune) with
the control's selector as its target, and run the catalog tests. Write the
description in plain words: it is both search text and what Dig deeper tells the
model about the setting.

### Extensions

Nothing to do. [ExtensionEntries](providers/ExtensionEntries.md) derives entries
from the extension list at search time: each enabled extension is findable by
name and description and opens its settings page (its own Settings tab when its
manifest asks for one, else its page under Settings > Extensions), and an
extension with an LLM Setup tab also gets an entry for that page.
