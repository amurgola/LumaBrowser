# MCP tools

LumaBrowser exposes its browser and automation features as MCP tools through `mcp-server.js`, which talks to the REST API on port 3000 (`LUMA_API_PORT`). Settings, LLM, Connect your agent registers the server with Claude Code, Codex, OpenCode, and Cline; "Export the MCP config" writes the same entry as JSON for any other client. Individual tools can be switched off under Settings, API & MCP.

## Groups

| Group | Tools | What they do |
| --- | --- | --- |
| Tabs | `browser_get_tabs`, `browser_create_tab`, `browser_close_tab`, `browser_navigate`, `browser_refresh` | Open, list, close, and move tabs. Tab ids come from `browser_get_tabs`. |
| Reading a page | `browser_observe_page`, `browser_get_source`, `browser_get_element`, `browser_get_table`, `browser_extract_data`, `browser_collect_list`, `browser_screenshot`, `browser_locate` | Observe is the cheap first look; source reads the page as Markdown, text or HTML; extract and collect pull structured data; locate finds an element by description. |
| Acting on a page | `browser_click`, `browser_click_until`, `browser_click_at`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_set_date`, `browser_set_slider`, `browser_press_key`, `browser_scroll`, `browser_wait_for`, `browser_handle_dialog`, `browser_execute_js` | Every action returns evidence of what changed so the next step can be trusted. |
| Diagnostics | `browser_get_console`, `browser_get_network` | Console messages and network log for a tab. |
| Page monitors | `page_monitor_create`, `page_monitor_check`, `page_monitor_list`, `page_monitor_history`, `page_monitor_set_paused`, `page_monitor_delete` | Watch a page for changes on a schedule. |
| Timed tasks | `timed_tasks_create`, `timed_tasks_list`, `timed_tasks_trigger`, `timed_tasks_get_runs`, `timed_tasks_set_paused`, `timed_tasks_delete` | Scheduled automations with run history. |
| Watchers | `watcher_add`, `watcher_list`, `watcher_toggle`, `watcher_remove` | Network watchers that fire on matching requests. |
| Desktop control | `desktop_list_windows`, `desktop_focus`, `desktop_observe`, `desktop_screenshot`, `desktop_click`, `desktop_type`, `desktop_set_value`, `desktop_press_key`, `desktop_scroll`, `desktop_drag`, `desktop_launch` | Native windows outside the browser (Windows first, accessibility tree first); `desktop_launch` opens an app, file or URL. |
| Terminal | `terminal_list`, `terminal_open`, `terminal_run`, `terminal_send`, `terminal_read`, `terminal_close` | Real interactive shell sessions that keep their state, shown to the user in a tab. Off until the user switches on "Let AI use the terminal" in Settings. Page tools refuse a terminal tab: use these. |
| Game play | `game_start_session`, `game_status`, `game_set_goals`, `game_press`, `game_hold`, `game_click`, `game_mouse_move`, `game_wait`, `game_note`, `game_save_macro`, `game_run_macro`, `game_calibrate_mouse`, `game_allow` | Input into a running game with macros and goals. |
| Agents | `list_agents`, `chat_with_agent` | Talk to a LumaBrowser agent (its own model, tools and knowledge base). |
| Tool forge | `create_tool`, `test_tool`, `publish_tool` | Build a sandboxed chat tool from a description. |
| Notifications | `send_notification_ntfy` | Push a message through ntfy. |

## Working with pages

### Which tab

- `browser_get_tabs` lists the tabs in the user's tab strip; the one with `active: true` is the tab they are looking at.
- Work in a silent tab (`browser_create_tab` with `silent: true`) when the browsing is only your own research. A silent tab is invisible to the user but has a normal-sized viewport, and any tab its links open is silent too. `includeSilent: true` lists them; close them when you are done.
- Work in the user's active tab, or a visible one, when the user will review or take over the result (a form you fill in for them, a page they asked to see).
- `includeHidden: true` also lists the user's persisted tabs that live hidden off the strip (mail, chat apps). Leave them out unless the task is about one of them.
- An action's `evidence` says when it opened a tab and whether the user can see it: `a new tab opened (tab 12, silent)` or `(tab 12, visible to the user)`.

### Reading

- To read content, use `browser_get_source` with `type: "markdown"` (headings, lists, tables and links kept; the smallest) or `type: "text"` (the visible text, one line per block). `clean`, `minimal` and `full` return HTML and are for inspecting structure.
- Pass `selector` to read only part of a page, for example `"main"` to skip the header, menus and footer. Every element the selector matches is returned, in page order.
- For repeating items use `browser_extract_data`. A field is the matched element's text; end the child selector with `@attribute` to read an attribute instead: `{"title": "a.title", "url": "a.title@href", "image": "img@src", "typed": "input@value"}`. An input, textarea or select with no text reads as what it holds.
- `browser_collect_list` scrolls a long list to its end and takes the same child selectors.
- To read small text off the screen, `browser_screenshot` with `selector` captures one element whole at full size. A full-page screenshot of a long page is scaled down by most clients until its text is unreadable.

### Acting

- `browser_observe_page` numbers the interactive elements; pass those `ref` numbers to click, type, fill and press-key tools. On a long page the list is cut short: pass `selector` (`"form"`, `"[role=dialog]"`) to list one part of the page in full.
- A rich-text editor that lives in an iframe is listed as `input:richtext`. Type into it by passing the iframe's ref or selector to `browser_type`.
- To click something again and again until it goes through (an item that keeps selling out, a queue), call `browser_click_until` once instead of looping click and observe: it finds the link by its visible `text` before every click, stops when `untilText`, `untilSelector` or `untilUrl` holds, loads a stuck page again, and with `alert: true` shows the tab, raises the window and posts a desktop notification. Give it a stop condition that is only true in the state you want; it refuses one that already holds. On `outcome: "timeout"` call it again with the same arguments.
- Typing leaves the field focused, as a user who has not moved on yet. A page that only saves a field when focus leaves it needs `browser_press_key` with `Tab` afterwards.

## Reading the live list

`GET http://localhost:3000/api/` lists every REST route, and the MCP server's `tools/list` reflects exactly what is enabled. Extensions add their own tools; the names above are the core set.

## In-app chat tools

The chat agent inside LumaBrowser has the same browser tools plus groups that only make sense in-app: artifacts, live modules, widget data, images, video, music, web search, knowledge base, code validation, programmatic tools, desktop control, game play, and tool forge. Those are switched on per group under Settings, API & MCP, Agent tools.
