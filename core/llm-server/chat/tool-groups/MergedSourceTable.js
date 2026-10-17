class MergedSourceTable {
  static SOURCES = Object.freeze({
    'core.desktop': Object.freeze({
      key: 'desktop',
      label: 'Desktop control',
      stub: 'See and operate OTHER apps on the Windows desktop of the user (not the browser): '
        + 'desktop_launch opens an app (e.g. msedge with a URL); desktop_list_windows -> desktop_observe '
        + '(UI Automation refs) or desktop_screenshot -> desktop_click / desktop_type / desktop_press_key / '
        + 'desktop_scroll. What has no ref (video players, canvas, taskbar) is clicked or scrolled by description '
        + '(a vision model finds it); hwnd 0 is the whole desktop. Work like a person: open a site\'s home page and '
        + 'use its own search and menus, never a guessed URL; once in a desktop app, stay on desktop_* for it.',
    }),
    'core.games': Object.freeze({
      key: 'games',
      label: 'Game play',
      stub: 'Play a game running in a window on the user\'s Windows desktop, best for turn-based or pausable games '
        + '(each look takes about a second): game_start_session -> game_allow (user approves) -> '
        + 'game_press / game_hold / game_click / game_mouse_move -> game_wait (screenshot) -> plan; '
        + 'keep goals and notes with game_set_goals / game_note; game_status reports when you are stuck.',
    }),
    'core.delegation': Object.freeze({
      key: 'delegation',
      label: 'Delegation',
      stub: 'Hand a task to a specialised chat mode or one of the user\'s custom agents, which works on it in a '
        + 'sub-conversation nested under this chat: BUILD AND INSTALL A LUMABROWSER EXTENSION, work on a code '
        + 'project folder, build a game, or talk to a custom agent. list_delegates -> delegate_task({ target, task }); '
        + 'answer its questions with delegate_task({ conversationId, message }).',
    }),
    'ext.tool-forge': Object.freeze({
      key: 'tool_forge',
      label: 'Tool forge',
      stub: 'Build a NEW custom chat tool for the user (sandboxed JS that calls an API): '
        + 'create_tool → test_tool → publish_tool. Publishing enables the tool immediately.',
    }),
  });

  static forSource(source) {
    if (!source || !Object.prototype.hasOwnProperty.call(MergedSourceTable.SOURCES, source)) return null;
    return MergedSourceTable.SOURCES[source];
  }
}

module.exports = MergedSourceTable;
