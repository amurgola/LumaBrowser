(function () {
  'use strict';
  if (window.AI && window.AI.__luma) return;

  var m = /\/api\/ext\/game-mode\/play\/([^/]+)\//.exec(location.pathname);
  var convId = m ? decodeURIComponent(m[1]) : null;
  var base = (convId && /^https?:$/.test(location.protocol))
    ? location.origin + '/api/ext/game-mode/ai/' + encodeURIComponent(convId)
    : null;

  var state = { online: false, checked: false, model: null, imageReady: false, pending: 0 };
  var listeners = [];
  var readyPromise = null;

  function status() { return { online: state.online, pending: state.pending, model: state.model, imageReady: state.imageReady }; }

  function notify() {
    var s = status();
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](s); } catch (_) {} }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'luma-ai-status', online: s.online, pending: s.pending }, '*');
      }
    } catch (_) {}
  }

  function busy(delta) { state.pending = Math.max(0, state.pending + delta); notify(); }

  function request(path, method, body) {
    if (!base) return Promise.reject(new Error('AI offline'));
    var opts = { method: method || 'GET', headers: {} };
    if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(base + path, opts).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (_) { j = null; }
        if (!r.ok) {
          var msg = (j && j.error) || ('HTTP ' + r.status);
          var err = new Error(msg); err.status = r.status; err.busy = !!(j && j.busy);
          throw err;
        }
        return j;
      });
    });
  }


  var storeKey = 'luma-ai-store:' + (convId || location.pathname);
  var col = {};
  var storeLoaded = false;

  function localLoad() {
    try { var raw = localStorage.getItem(storeKey); if (raw) col = JSON.parse(raw) || {}; } catch (_) { col = {}; }
  }
  function localSave() { try { localStorage.setItem(storeKey, JSON.stringify(col)); } catch (_) {} }
  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  var store = {
    load: function () {
      if (!base) { localLoad(); storeLoaded = true; return Promise.resolve(store.all()); }
      return request('/store').then(function (doc) {
        col = (doc && doc.collections) || {};
        storeLoaded = true;
        return store.all();
      });
    },
    all: function () { return clone(col); },
    list: function (collection) { return Promise.resolve(clone(col[collection] || {})); },
    get: function (collection, key, fallback) {
      var c = col[collection];
      var has = c && Object.prototype.hasOwnProperty.call(c, key);
      return Promise.resolve(has ? clone(c[key]) : fallback);
    },
    set: function (collection, key, value) {
      if (!col[collection]) col[collection] = {};
      var prev = col[collection][key];
      col[collection][key] = clone(value);
      if (!base) { localSave(); return Promise.resolve({ success: true }); }
      return request('/store/' + encodeURIComponent(collection) + '/' + encodeURIComponent(key), 'PUT', { value: value })
        .catch(function (e) {
          if (prev === undefined) delete col[collection][key]; else col[collection][key] = prev;
          return { success: false, error: e.message };
        });
    },
    remove: function (collection, key) {
      if (col[collection]) delete col[collection][key];
      if (!base) { localSave(); return Promise.resolve({ success: true }); }
      return request('/store/' + encodeURIComponent(collection) + '/' + encodeURIComponent(key), 'DELETE')
        .catch(function (e) { return { success: false, error: e.message }; });
    },
    clear: function (collection) {
      delete col[collection];
      if (!base) { localSave(); return Promise.resolve({ success: true }); }
      return request('/store/' + encodeURIComponent(collection), 'DELETE')
        .catch(function (e) { return { success: false, error: e.message }; });
    },
    reset: function () {
      col = {};
      if (!base) { localSave(); return Promise.resolve({ success: true }); }
      return request('/store', 'DELETE').catch(function (e) { return { success: false, error: e.message }; });
    },
  };

  function storeTools(collections) {
    var allowed = Array.isArray(collections) && collections.length ? collections : null;
    function ok(c) { return !allowed || allowed.indexOf(c) !== -1; }
    var scope = allowed ? ' Collections you may use: ' + allowed.join(', ') + '.' : '';
    return [
      {
        name: 'store_get',
        description: 'Read one saved value (or a whole collection when key is omitted).' + scope,
        parameters: { type: 'object', properties: { collection: { type: 'string' }, key: { type: 'string' } }, required: ['collection'] },
        handler: function (a) {
          if (!ok(a.collection)) return { error: 'collection not allowed' };
          return a.key ? store.get(a.collection, a.key, null) : store.list(a.collection);
        },
      },
      {
        name: 'store_set',
        description: 'Save a value under collection/key (overwrites).' + scope,
        parameters: { type: 'object', properties: { collection: { type: 'string' }, key: { type: 'string' }, value: {} }, required: ['collection', 'key', 'value'] },
        handler: function (a) {
          if (!ok(a.collection)) return { error: 'collection not allowed' };
          return store.set(a.collection, a.key, a.value);
        },
      },
    ];
  }


  var OFFLINE_TEXT = '...';

  function toolDefs(tools) {
    var out = [];
    for (var i = 0; i < (tools || []).length; i++) {
      var t = tools[i];
      if (!t || !t.name) continue;
      out.push({ name: t.name, description: t.description || '', parameters: t.parameters || { type: 'object', properties: {} } });
    }
    return out;
  }

  function findTool(tools, name) {
    for (var i = 0; i < (tools || []).length; i++) if (tools[i] && tools[i].name === name) return tools[i];
    return null;
  }

  function runHandler(tool, args) {
    return new Promise(function (resolve) {
      var out;
      try { out = typeof tool.handler === 'function' ? tool.handler(args || {}) : { error: 'no handler' }; }
      catch (e) { resolve({ error: String(e && e.message || e) }); return; }
      Promise.resolve(out).then(function (v) { resolve(v === undefined ? { ok: true } : v); },
        function (e) { resolve({ error: String(e && e.message || e) }); });
    });
  }

  function streamAsk(messages, opts) {
    var body = { system: opts.system, messages: messages, temperature: opts.temperature, think: opts.think, timeoutMs: opts.timeoutMs };
    return fetch(base + '/stream', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (!r.ok || !r.body) throw new Error('stream HTTP ' + r.status);
        var reader = r.body.getReader();
        var dec = new TextDecoder();
        var buf = '';
        var text = '';
        var finalText = null;
        var errorMsg = null;
        function handle(line) {
          if (line.indexOf('data:') !== 0) return;
          var j = null;
          try { j = JSON.parse(line.slice(5).trim()); } catch (_) { return; }
          if (j.delta) { text += j.delta; try { opts.onToken(j.delta, text); } catch (_) {} }
          if (j.done) finalText = typeof j.text === 'string' ? j.text : text;
          if (j.error) errorMsg = j.error;
        }
        function pump() {
          return reader.read().then(function (res) {
            if (res.done) {
              if (buf) handle(buf);
              if (errorMsg && !text) throw new Error(errorMsg);
              return finalText !== null ? finalText : text;
            }
            buf += dec.decode(res.value, { stream: true });
            var idx;
            while ((idx = buf.indexOf('\n')) !== -1) { handle(buf.slice(0, idx).trim()); buf = buf.slice(idx + 1); }
            return pump();
          });
        }
        return pump();
      });
  }

  function ask(prompt, opts) {
    opts = opts || {};
    var messages = [];
    var hist = opts.history || opts.messages || [];
    for (var i = 0; i < hist.length; i++) {
      if (hist[i] && hist[i].content) messages.push({ role: hist[i].role === 'assistant' ? 'assistant' : 'user', content: String(hist[i].content) });
    }
    if (prompt != null && String(prompt).trim()) messages.push({ role: 'user', content: String(prompt) });
    var shape = opts.schema ? (typeof opts.schema === 'string' ? opts.schema : JSON.stringify(opts.schema)) : null;
    var json = false;
    if (typeof opts.json === 'string' && opts.json.trim()) json = opts.json;
    else if (shape) json = shape;
    else if (opts.json) json = true;
    var tools = opts.tools || [];
    if (!base) return Promise.resolve(json ? {} : OFFLINE_TEXT);

    busy(1);
    var finish = function (v) { busy(-1); return v; };
    var failed = function (e) { busy(-1); throw e; };

    if (typeof opts.onToken === 'function' && !json && !tools.length) {
      return streamAsk(messages, opts).then(finish, function () {
        return request('/complete', 'POST', { system: opts.system, messages: messages, temperature: opts.temperature, think: opts.think, timeoutMs: opts.timeoutMs })
          .then(function (r) { if (!r || !r.success) throw new Error((r && r.error) || 'ask failed'); return finish(r.text); }, failed);
      });
    }

    var maxSteps = Math.max(1, Math.min(12, Number(opts.maxSteps) || 6));
    var steps = 0;
    function step() {
      var body = { system: opts.system, messages: messages, json: json, tools: toolDefs(tools), temperature: opts.temperature, think: opts.think, timeoutMs: opts.timeoutMs };
      return request('/complete', 'POST', body).then(function (r) {
        if (!r || !r.success) throw new Error((r && r.error) || 'ask failed');
        if (r.kind === 'tool') {
          steps += 1;
          var tool = findTool(tools, r.name);
          return runHandler(tool || { handler: function () { return { error: 'unknown tool' }; } }, r.args).then(function (result) {
            messages.push({ role: 'assistant', content: r.raw || JSON.stringify({ tool: r.name, args: r.args }) });
            var text = typeof result === 'string' ? result : JSON.stringify(result);
            if (steps >= maxSteps) {
              messages.push({ role: 'user', content: 'RESULT of ' + r.name + ': ' + text + '\nYou have used every function call available. Reply with your final answer now.' });
              tools = [];
            } else {
              messages.push({ role: 'user', content: 'RESULT of ' + r.name + ': ' + text });
            }
            return step();
          });
        }
        return json ? (r.value !== undefined ? r.value : safeParse(r.text)) : r.text;
      });
    }
    return step().then(finish, failed);
  }

  function safeParse(t) { try { return JSON.parse(t); } catch (_) { return {}; } }

  function generate(what, opts) {
    opts = opts || {};
    var shape = opts.schema ? (typeof opts.schema === 'string' ? opts.schema : JSON.stringify(opts.schema)) : true;
    var prompt = opts.prompt || ('Generate ' + String(what) + '.');
    return ask(prompt, { system: opts.system, json: shape, think: opts.think, temperature: opts.temperature, history: opts.history, tools: opts.tools });
  }


  var NPC_COLLECTION = '_npc';
  var NPC_MAX_TURNS = 24;

  function npc(id, cfg) {
    cfg = cfg || {};
    var name = cfg.name || id;
    var remember = cfg.remember !== false;
    var history = [];
    var loaded = !remember;
    var loading = null;

    function load() {
      if (loaded) return Promise.resolve();
      if (!loading) {
        loading = store.get(NPC_COLLECTION, id, null).then(function (saved) {
          if (saved && Array.isArray(saved.history)) history = saved.history;
          loaded = true;
        });
      }
      return loading;
    }
    function persist() {
      if (!remember) return Promise.resolve();
      return store.set(NPC_COLLECTION, id, { name: name, history: history.slice(-NPC_MAX_TURNS * 2) });
    }
    function systemFor(extra) {
      var parts = [
        'You are ' + name + ', a character in this game. Stay in character. Speak in first person, in your own voice, ' +
        'in at most ' + (cfg.maxSentences || 3) + ' sentences. Never narrate the player\'s actions or speak for them. ' +
        'Output only your spoken words (no name prefix, no stage directions unless the game asks for them).',
      ];
      if (cfg.persona) parts.push('About you: ' + cfg.persona);
      if (cfg.knowledge) parts.push('What you know: ' + cfg.knowledge);
      if (cfg.goal) parts.push('What you want: ' + cfg.goal);
      if (extra) parts.push('Current situation: ' + extra);
      if (cfg.system) parts.push(cfg.system);
      return parts.join('\n');
    }

    var self = {
      id: id,
      name: name,
      get history() { return history.slice(); },
      say: function (text, opts) {
        opts = opts || {};
        return load().then(function () {
          var hist = history.slice(-NPC_MAX_TURNS * 2);
          return ask(text, {
            system: systemFor(opts.context || cfg.context),
            history: hist,
            onToken: opts.onToken,
            tools: opts.tools,
            json: opts.json,
            temperature: opts.temperature != null ? opts.temperature : (cfg.temperature != null ? cfg.temperature : 0.9),
            think: opts.think,
          }).then(function (reply) {
            history.push({ role: 'user', content: String(text) });
            history.push({ role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) });
            return persist().then(function () { return reply; });
          });
        });
      },
      remember: function (fact) {
        return load().then(function () {
          history.push({ role: 'user', content: '(Note to self: ' + String(fact) + ')' });
          history.push({ role: 'assistant', content: 'Understood.' });
          return persist();
        });
      },
      reset: function () { history = []; loaded = true; return remember ? store.remove(NPC_COLLECTION, id) : Promise.resolve(); },
    };
    return self;
  }


  function image(opts) {
    opts = opts || {};
    if (!base) return Promise.resolve({ url: null, path: null, status: 'offline' });
    busy(1);
    return request('/image', 'POST', opts).then(function (r) {
      busy(-1);
      if (!r || !r.success) return { url: null, path: null, status: 'error', error: (r && r.error) || 'image failed' };
      return { url: r.url, path: r.path, status: r.status, width: r.width, height: r.height };
    }, function (e) { busy(-1); return { url: null, path: null, status: 'error', error: e.message }; });
  }


  function ready() {
    if (readyPromise) return readyPromise;
    readyPromise = (function () {
      if (!base) { state.checked = true; return store.load().then(function () { notify(); return status(); }); }
      return request('/ping').then(function (p) {
        state.online = !!(p && p.ok);
        state.model = (p && p.model) || null;
        state.imageReady = !!(p && p.imageReady);
      }, function () { state.online = false; })
        .then(function () { state.checked = true; return store.load().catch(function () {}); })
        .then(function () { notify(); return status(); });
    })();
    return readyPromise;
  }

  window.AI = {
    __luma: true,
    version: 1,
    conversationId: convId,
    ready: ready,
    ask: ask,
    generate: generate,
    npc: npc,
    store: store,
    storeTools: storeTools,
    image: image,
    status: status,
    onStatus: function (cb) { if (typeof cb === 'function') listeners.push(cb); return function () { listeners = listeners.filter(function (f) { return f !== cb; }); }; },
    get online() { return state.online; },
  };
})();
