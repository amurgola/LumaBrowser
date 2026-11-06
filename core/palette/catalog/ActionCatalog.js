const ActionCatalog = Object.freeze([
  { id: 'new-tab', label: 'New tab', keys: 'Ctrl+T', keywords: ['open tab', 'blank page'], run: { shell: 'new-tab' } },
  { id: 'new-private-window', label: 'New private window', keys: 'Ctrl+Shift+N', keywords: ['incognito', 'private browsing', 'inprivate'], run: { shell: 'new-private-window' } },
  { id: 'reopen-closed', label: 'Reopen closed tab', keys: 'Ctrl+Shift+T', keywords: ['undo close', 'restore tab'], run: { shell: 'reopen-closed' } },
  { id: 'close-tab', label: 'Close tab', keys: 'Ctrl+W', keywords: ['close page'], run: { shell: 'close-tab' } },
  { id: 'history', label: 'History', keys: 'Ctrl+H', keywords: ['visited pages', 'browsing history'], run: { shell: 'history' } },
  { id: 'bookmarks', label: 'Bookmark manager', keys: 'Ctrl+Shift+O', keywords: ['favorites', 'saved pages'], run: { shell: 'bookmarks' } },
  { id: 'bookmark', label: 'Bookmark this page', keys: 'Ctrl+D', keywords: ['favorite', 'star', 'save page'], run: { shell: 'bookmark' } },
  { id: 'downloads', label: 'Downloads', keys: 'Ctrl+J', keywords: ['downloaded files'], run: { shell: 'downloads' } },
  { id: 'find', label: 'Find in page', keys: 'Ctrl+F', keywords: ['search page', 'search text'], run: { shell: 'find' } },
  { id: 'print', label: 'Print page', keys: 'Ctrl+P', keywords: ['pdf', 'printer'], run: { shell: 'print' } },
  { id: 'reload', label: 'Reload page', keys: 'Ctrl+R', keywords: ['refresh'], run: { shell: 'reload' } },
  { id: 'hard-reload', label: 'Hard reload page', keys: 'Ctrl+Shift+R', keywords: ['refresh without cache', 'force reload'], run: { shell: 'hard-reload' } },
  { id: 'fullscreen', label: 'Full screen', keys: 'F11', keywords: ['fullscreen', 'kiosk', 'hide toolbar'], run: { shell: 'fullscreen' } },
  { id: 'zoom-in', label: 'Zoom in', keys: 'Ctrl+=', keywords: ['bigger', 'larger text', 'magnify'], run: { shell: 'zoom-in' } },
  { id: 'zoom-out', label: 'Zoom out', keys: 'Ctrl+-', keywords: ['smaller', 'smaller text'], run: { shell: 'zoom-out' } },
  { id: 'zoom-reset', label: 'Reset zoom', keys: 'Ctrl+0', keywords: ['actual size', '100%'], run: { shell: 'zoom-reset' } },
  { id: 'clear-data', label: 'Clear browsing data', keys: 'Ctrl+Shift+Delete', keywords: ['delete cookies', 'clear cache', 'wipe history'], run: { shell: 'clear-data' } },
  { id: 'focus-url', label: 'Go to address bar', keys: 'Ctrl+L', keywords: ['url bar', 'omnibox', 'type address'], run: { shell: 'focus-url' } },
  { id: 'open-chat', label: 'Open chat', keys: '', keywords: ['ai', 'assistant', 'llm', 'ask', 'new chat', 'conversation'], run: { main: 'open-chat' } },
  { id: 'open-settings', label: 'Open settings', keys: '', keywords: ['preferences', 'options', 'configure'], run: { main: 'open-settings' } },
]);

module.exports = ActionCatalog;
