export default class AcceleratorTable {
  static TABLE = {
    'ctrl+t': 'new-tab',
    'ctrl+n': 'new-tab',
    'ctrl+w': 'close-tab',
    'ctrl+f4': 'close-tab',
    'ctrl+shift+t': 'reopen-closed',
    'ctrl+shift+u': 'runtime-trace',
    'ctrl+tab': 'next-tab',
    'ctrl+pagedown': 'next-tab',
    'ctrl+shift+tab': 'prev-tab',
    'ctrl+pageup': 'prev-tab',
    'ctrl+1': 'select-tab-1', 'ctrl+2': 'select-tab-2', 'ctrl+3': 'select-tab-3', 'ctrl+4': 'select-tab-4',
    'ctrl+5': 'select-tab-5', 'ctrl+6': 'select-tab-6', 'ctrl+7': 'select-tab-7', 'ctrl+8': 'select-tab-8',
    'ctrl+9': 'select-last-tab',
    'ctrl+r': 'reload',
    'f5': 'reload',
    'ctrl+shift+r': 'hard-reload',
    'ctrl+f5': 'hard-reload',
    'ctrl+l': 'focus-url',
    'alt+d': 'focus-url',
    'f6': 'focus-url',
    'ctrl+f': 'find',
    'f3': 'find-next',
    'shift+f3': 'find-prev',
    'ctrl+g': 'find-next',
    'ctrl+shift+g': 'find-prev',
    'alt+arrowleft': 'back',
    'alt+arrowright': 'forward',
    'ctrl+d': 'bookmark',
    'ctrl+h': 'history',
    'ctrl+shift+o': 'bookmarks',
    'ctrl+j': 'downloads',
    'ctrl+p': 'print',
    'ctrl+=': 'zoom-in',
    'ctrl++': 'zoom-in',
    'ctrl+shift+=': 'zoom-in',
    'ctrl+-': 'zoom-out',
    'ctrl+0': 'zoom-reset',
    'escape': 'stop',
    'f12': 'devtools',
    'ctrl+shift+i': 'devtools',
  };

  static forEvent(e) {
    if (!e || e.isComposing) return null;
    const key = (e.key || '').toLowerCase();
    if (!key) return null;
    const action = AcceleratorTable.TABLE[AcceleratorTable.combo(e, key)];
    if (action) return action;
    if ((e.ctrlKey || e.metaKey) && /^Digit[1-9]$/.test(e.code || '')) {
      const n = e.code.slice(5);
      return n === '9' ? 'select-last-tab' : `select-tab-${n}`;
    }
    return null;
  }

  static combo(e, key) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(key === ' ' ? 'space' : key);
    return parts.join('+');
  }
}
