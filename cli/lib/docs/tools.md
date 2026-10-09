# MCP tools

LumaBrowser exposes its browser and automation features as MCP tools through `mcp-server.js`, which talks to the REST API on port 3000 (`LUMA_API_PORT`). Settings, LLM, Connect your agent registers the server with Claude Code, Codex, OpenCode, and Cline; "Export the MCP config" writes the same entry as JSON for any other client. Individual tools can be switched off under Settings, API & MCP.

## Groups

| Group | Tools | What they do |
| --- | --- | --- |
| Tabs | `browser_get_tabs`, `browser_create_tab`, `browser_close_tab`, `browser_navigate`, `browser_refresh` | Open, list, close, and move tabs. Tab ids come from `browser_get_tabs`. |
| Reading a page | `browser_observe_page`, `browser_get_source`, `browser_get_element`, `browser_get_table`, `browser_extract_data`, `browser_collect_list`, `browser_screenshot`, `browser_locate` | Observe is the cheap first look; source is full HTML; extract and collect pull structured data; locate finds an element by description. |
| Acting on a page | `browser_click`, `browser_click_at`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_set_date`, `browser_set_slider`, `browser_press_key`, `browser_scroll`, `browser_wait_for`, `browser_handle_dialog`, `browser_execute_js` | Every action returns evidence of what changed so the next step can be trusted. |
| Diagnostics | `browser_get_console`, `browser_get_network` | Console messages and network log for a tab. |
| Page monitors | `page_monitor_create`, `page_monitor_check`, `page_monitor_list`, `page_monitor_history`, `page_monitor_set_paused`, `page_monitor_delete` | Watch a page for changes on a schedule. |
| Timed tasks | `timed_tasks_create`, `timed_tasks_list`, `timed_tasks_trigger`, `timed_tasks_get_runs`, `timed_tasks_set_paused`, `timed_tasks_delete` | Scheduled automations with run history. |
| Watchers | `watcher_add`, `watcher_list`, `watcher_toggle`, `watcher_remove` | Network watchers that fire on matching requests. |
| Desktop control | `desktop_list_windows`, `desktop_focus`, `desktop_observe`, `desktop_screenshot`, `desktop_click`, `desktop_type`, `desktop_set_value`, `desktop_press_key`, `desktop_scroll`, `desktop_drag` | Native windows outside the browser (Windows first, accessibility tree first). |
| Game play | `game_start_session`, `game_status`, `game_set_goals`, `game_press`, `game_hold`, `game_click`, `game_mouse_move`, `game_wait`, `game_note`, `game_save_macro`, `game_run_macro`, `game_calibrate_mouse`, `game_allow` | Input into a running game with macros and goals. |
| Agents | `list_agents`, `chat_with_agent` | Talk to a LumaBrowser agent (its own model, tools and knowledge base). |
| Tool forge | `create_tool`, `test_tool`, `publish_tool` | Build a sandboxed chat tool from a description. |
| Notifications | `send_notification_ntfy` | Push a message through ntfy. |

## Reading the live list

`GET http://localhost:3000/api/` lists every REST route, and the MCP server's `tools/list` reflects exactly what is enabled. Extensions add their own tools; the names above are the core set.

## In-app chat tools

The chat agent inside LumaBrowser has the same browser tools plus groups that only make sense in-app: artifacts, live modules, widget data, images, video, music, web search, knowledge base, code validation, programmatic tools, desktop control, game play, and tool forge. Those are switched on per group under Settings, API & MCP, Agent tools.
