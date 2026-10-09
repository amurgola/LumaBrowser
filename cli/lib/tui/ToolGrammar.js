(function (root) {
  class ToolGrammar {
    static TOOL_STYLE = {
      read_file: { verb: 'Read', ing: 'reading', glyph: 'arrowR' },
      read_extension_file: { verb: 'Read', ing: 'reading', glyph: 'arrowR' },
      write_file: { verb: 'Write', ing: 'writing', glyph: 'arrowL', mutating: true },
      write_extension_file: { verb: 'Write', ing: 'writing', glyph: 'arrowL', mutating: true },
      edit_file: { verb: 'Edit', ing: 'editing', glyph: 'arrowL', mutating: true },
      run_command: { verb: '', ing: 'running', glyph: 'shell', mutating: true },
      grep: { verb: 'Grep', ing: 'searching', glyph: 'search' },
      find: { verb: 'Find', ing: 'finding', glyph: 'search' },
      list_dir: { verb: 'List', ing: 'listing', glyph: 'arrowR' },
      list_extension_files: { verb: 'List', ing: 'listing', glyph: 'arrowR' },
      project_overview: { verb: 'Overview', ing: 'surveying the project', glyph: 'arrowR' },
      dispatch_batch: { verb: 'Batch', ing: 'batching', glyph: 'running' },
      install_extension: { verb: 'Install', ing: 'installing', glyph: 'arrowL', mutating: true },
      discard_build: { verb: 'Discard build', ing: 'discarding the build', glyph: 'arrowL', mutating: true },
      validate_code: { verb: 'Validate', ing: 'validating', glyph: 'ok' },
      web_search: { verb: 'Search web', ing: 'searching the web', glyph: 'web' },
      fetch_page: { verb: 'Fetch', ing: 'fetching', glyph: 'web' },
      fetch_url: { verb: 'Fetch', ing: 'fetching', glyph: 'web' },
      navigate: { verb: 'Open', ing: 'opening', glyph: 'web' },
      take_screenshot: { verb: 'Screenshot', ing: 'taking a screenshot', glyph: 'web' },
      click: { verb: 'Click', ing: 'clicking', glyph: 'web' },
      type_text: { verb: 'Type', ing: 'typing', glyph: 'web' },
      chat_with_agent: { verb: 'Ask agent', ing: 'asking an agent', glyph: 'agent' },
      list_agents: { verb: 'Agents', ing: 'listing agents', glyph: 'agent' },
      create_artifact: { verb: 'Artifact', ing: 'creating an artifact', glyph: 'artifact' },
      edit_artifact: { verb: 'Edit artifact', ing: 'editing an artifact', glyph: 'artifact' },
      create_live_artifact: { verb: 'Live artifact', ing: 'creating a live artifact', glyph: 'artifact' },
      save_artifact: { verb: 'Save artifact', ing: 'saving an artifact', glyph: 'artifact', mutating: true },
      send_webhook: { verb: 'Webhook', ing: 'sending a webhook', glyph: 'web', mutating: true },
    };

    static FILE_TOOLS = ['read_file', 'write_file', 'edit_file', 'save_artifact'];
    static MUTATING_FILE_TOOLS = ['write_file', 'edit_file'];

    static LONG_WAIT_AFTER = 20;
    static LONG_WAIT_EVERY = 10;
    static LONG_WAIT = {
      thinking: ['still thinking', 'turning it over', 'connecting the dots', 'weighing the options', 'following a thread', 'thinking it through', 'double-checking'],
      working: ['still working', 'working through it', 'taking a longer look', 'still at it', 'sticking with it'],
    };

    static STATUS_TEXT = {
      'switching-model': 'switching model',
      'switching-context': 'resizing context',
      'loading-vision': 'loading vision',
      'unloading-vision': 'unloading vision',
      'recovering-cancelled': 'recovering the server',
      'starting-server': 'starting the local model',
      'reclaiming-vram': 'reclaiming VRAM',
      'waiting-for-slot': 'waiting for a free slot',
      compacting: 'compacting history',
      compacted: 'compacted history',
      retrying: 'retrying',
    };

    static toolStyle(name) {
      if (ToolGrammar.TOOL_STYLE[name]) return ToolGrammar.TOOL_STYLE[name];
      const plain = String(name || 'tool').replace(/_/g, ' ');
      return { verb: plain, ing: 'calling ' + plain, glyph: 'running' };
    }

    static pendingText(p) {
      let text = ToolGrammar.toolStyle(p && p.tool).ing;
      if (p && p.target) text += ' ' + p.target;
      if (p && p.chars > 0) text += ' · ' + ToolGrammar.fmtTokens(p.chars) + ' chars';
      return text;
    }

    static longWaitText(kind, secs) {
      const list = ToolGrammar.LONG_WAIT[kind];
      if (!list || !(secs >= ToolGrammar.LONG_WAIT_AFTER)) return null;
      const step = Math.floor((secs - ToolGrammar.LONG_WAIT_AFTER) / ToolGrammar.LONG_WAIT_EVERY);
      return list[step % list.length];
    }

    static statusText(p) {
      const phase = p && p.phase;
      let text = ToolGrammar.STATUS_TEXT[phase] || (typeof phase === 'string' ? phase.replace(/-/g, ' ') : 'working');
      if (phase === 'retrying' && p.attempt) text = 'retrying (attempt ' + p.attempt + ')';
      if (phase === 'waiting-for-slot' && p.inFlight != null) text = 'waiting for a free slot (' + p.inFlight + ' in flight)';
      return text;
    }

    static short(s, n) {
      const limit = n === undefined ? 60 : n;
      const text = String(s == null ? '' : s);
      return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
    }

    static toolDetail(name, params) {
      const p = params && typeof params === 'object' ? params : {};
      const short = ToolGrammar.short;
      switch (name) {
        case 'run_command': return short(p.command || '', 120);
        case 'read_file': return (p.path || '') + ToolGrammar._readRange(p);
        case 'grep': return '/' + short(p.pattern, 50) + '/' + (p.path ? ' in ' + p.path : '') + (p.glob ? ' (' + p.glob + ')' : '');
        case 'find': return (p.glob || p.pattern || '') + (p.path ? ' in ' + p.path : '');
        case 'edit_file': return (p.path || '') + (Array.isArray(p.edits) ? ' · ' + p.edits.length + ' edit' + (p.edits.length === 1 ? '' : 's') : '');
        case 'write_file': case 'write_extension_file': return (p.path || '') + ToolGrammar._lineCount(p.content);
        case 'web_search': return '"' + short(p.query, 60) + '"';
        case 'chat_with_agent': return (p.agent || p.name || '') + (p.message ? ' · "' + short(p.message, 50) + '"' : '');
        default: return ToolGrammar._genericDetail(p);
      }
    }

    static summarizeParams(name, params) {
      return ToolGrammar.toolDetail(name, params);
    }

    static trimSummary(name, params, summary) {
      if (!summary) return '';
      const p = params && typeof params === 'object' ? params : {};
      let s = ToolGrammar._withoutSubject(String(summary), ToolGrammar._subjects(p)).trim();
      if (name === 'edit_file' && /^\d+ edits?$/.test(s)) s = '';
      return s;
    }

    static fmtTokens(value) {
      const n = Number(value) || 0;
      if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k';
      return String(n);
    }

    static toolPath(name, params) {
      if (ToolGrammar.FILE_TOOLS.indexOf(name) === -1) return null;
      const p = params && typeof params === 'object' ? params : {};
      return p.path ? String(p.path) : null;
    }

    static _readRange(p) {
      if (!(p.offset || p.limit)) return '';
      const start = p.offset || 1;
      return ' :' + start + (p.limit ? '-' + (start + p.limit - 1) : '');
    }

    static _lineCount(content) {
      const lines = typeof content === 'string' ? content.split('\n').length : 0;
      return lines ? ' · ' + lines + ' line' + (lines === 1 ? '' : 's') : '';
    }

    static _genericDetail(p) {
      const short = ToolGrammar.short;
      if (p.path) return String(p.path);
      if (p.url) return short(p.url, 80);
      if (p.query) return '"' + short(p.query, 60) + '"';
      if (p.pattern) return '"' + short(p.pattern, 60) + '"';
      const keys = Object.keys(p).filter((k) => typeof p[k] !== 'object').slice(0, 3);
      return keys.map((k) => k + '=' + short(p[k], 24)).join(' ');
    }

    static _subjects(p) {
      const subjects = [];
      if (p.path) subjects.push(String(p.path));
      if (p.glob) subjects.push(String(p.glob));
      if (p.pattern) subjects.push('/' + p.pattern + '/');
      if (p.command) {
        const c = String(p.command);
        subjects.push(c.length > 48 ? c.slice(0, 48) + '…' : c);
      }
      return subjects;
    }

    static _withoutSubject(summary, subjects) {
      for (const subject of subjects) {
        if (summary.startsWith(subject + ' · ')) return summary.slice(subject.length + 3);
        if (summary === subject) return '';
      }
      return summary;
    }
  }

  if (typeof module === 'object' && module.exports) module.exports = ToolGrammar;
  if (root && typeof root === 'object') root.LumaToolGrammar = ToolGrammar;
}(typeof window !== 'undefined' ? window : null));
