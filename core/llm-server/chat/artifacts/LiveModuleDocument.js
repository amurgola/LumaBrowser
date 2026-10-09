const HtmlText = require('./HtmlText');

class LiveModuleDocument {
  static POLL_MS = 10000;
  static LT_ESCAPE = String.fromCharCode(92) + 'u003c';

  static BASE_CSS = [
    '#cm-live-root { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; font-size: 14px; line-height: 1.5; }',
    '#cm-live-root a { color: #2563eb; }',
    '#cm-live-root canvas { max-width: 100%; }',
    '#cm-live-root .cm-live-err { margin: 8px 0 0; padding: 8px 10px;'
      + ' background: rgba(248,113,113,0.12); color: #b91c1c; border-radius: 8px;'
      + ' font: 12px ui-monospace, monospace; white-space: pre-wrap; }',
    '#cm-live-root :where(h1,h2,h3,h4){margin:0 0 12px;line-height:1.25;font-weight:700}',
    '#cm-live-root :where(h2){font-size:20px} #cm-live-root :where(h3){font-size:16px}',
    '#cm-live-root :where(p){margin:0 0 10px} #cm-live-root :where(label){font-size:14px}',
    '#cm-live-root :where(hr){border:none;border-top:1px solid #e5e7eb;margin:12px 0}',
    '#cm-live-root :where(ul,ol){margin:0;padding:0;list-style:none}',
    '#cm-live-root :where(input,textarea,select,option,button){background-color:#fff;color:#1a2230;font-family:inherit;font-size:14px}',
    '#cm-live-root :where(input,textarea,select){padding:8px 12px;border:1px solid #ccc;border-radius:8px;outline:none}',
    '#cm-live-root :where(input:focus,textarea:focus,select:focus){border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.15)}',
    '#cm-live-root :where(button){padding:8px 16px;border:1px solid #d0d5dd;border-radius:8px;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s}',
    '#cm-live-root :where(button:hover){background:#f3f4f6}',
    '#cm-live-root :where(.lm-primary){background:#4f46e5;color:#fff;border-color:#4f46e5}',
    '#cm-live-root :where(.lm-primary:hover){background:#4338ca}',
    '#cm-live-root :where(.lm-ghost){background:none;border:none;color:#6b7280}',
    '#cm-live-root :where(.lm-ghost:hover){background:#f3f4f6;color:#1a2230}',
    '#cm-live-root :where(.lm-row){display:flex;align-items:center;gap:8px}',
    '#cm-live-root :where(.lm-between){display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '#cm-live-root :where(.lm-grow){flex:1}',
    '#cm-live-root :where(.lm-muted){color:#6b7280;font-size:13px}',
    '#cm-live-root :where(.lm-item){display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid #eee}',
    '#cm-live-root :where(.lm-card){background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px}',
  ].join('\n');

  static renderBody(row, opts, configuredBase) {
    const spec = LiveModuleDocument._parseSpec(row.content);
    const surface = LiveModuleDocument._surface(spec, opts || {}, configuredBase);
    const config = LiveModuleDocument._mountConfig(row, surface);
    return `<style>${LiveModuleDocument.BASE_CSS}</style>
<div class="cm-art-body"><div id="cm-live-root" style="background:#fff;color:#1a1a2e;padding:16px;border-radius:12px;">${spec.html || ''}</div></div>
${LiveModuleDocument._libTags(surface)}
${LiveModuleDocument._bootstrap(LiveModuleDocument._scriptSafeJson(String(spec.js || '')), LiveModuleDocument._scriptSafeJson(config))}`;
  }

  static _scriptSafeJson(value) {
    return JSON.stringify(value).replace(/</g, LiveModuleDocument.LT_ESCAPE);
  }

  static _parseSpec(content) {
    try {
      return JSON.parse(content || '{}') || {};
    } catch (_) {
      return {};
    }
  }

  static _surface(spec, opts, configuredBase) {
    const hasBaseOverride = opts.webBase != null;
    const base = hasBaseOverride ? String(opts.webBase).replace(/\/+$/, '') : (configuredBase || '');
    const canServeLibs = hasBaseOverride || !!base;
    return {
      base,
      canServeLibs,
      wantsChart: Array.isArray(spec.libs) && spec.libs.some((lib) => /chart/i.test(String(lib))),
      dataEndpoint: opts.dataEndpoint != null ? String(opts.dataEndpoint) : (canServeLibs ? `${base}/artifacts/data` : null),
      dataReadOnly: !!opts.dataReadOnly,
      apiEndpoint: LiveModuleDocument._apiEndpoint(opts, hasBaseOverride, canServeLibs, base),
    };
  }

  static _apiEndpoint(opts, hasBaseOverride, canServeLibs, base) {
    if (opts.apiEndpoint != null) return opts.apiEndpoint ? String(opts.apiEndpoint) : null;
    return (!hasBaseOverride && canServeLibs) ? `${base}/artifacts/api` : null;
  }

  static _mountConfig(row, surface) {
    return {
      rootId: row.root_id || row.id,
      endpoint: surface.dataEndpoint,
      readOnly: surface.dataReadOnly,
      pollMs: LiveModuleDocument.POLL_MS,
      apiEndpoint: surface.apiEndpoint,
      wantsChart: surface.wantsChart,
    };
  }

  static _libTags({ base, canServeLibs, wantsChart, dataEndpoint }) {
    if (!canServeLibs) return '';
    const src = HtmlText.escape(base);
    return [
      `<script src="${src}/llm-ui/resonant.js"></script>`,
      wantsChart ? `<script src="${src}/llm-ui/lib/chart/chart.umd.min.js"></script>` : '',
      dataEndpoint != null ? `<script src="${src}/llm-ui/js/artifact-data-client.js"></script>` : '',
    ].filter(Boolean).join('\n');
  }

  static _bootstrap(jsLiteral, configJson) {
    return `<script>
(function(){
  var root = document.getElementById('cm-live-root');
  // Match the inline renderer: models habitually call root.getElementById('x')
  // (a document-only method), so polyfill it to querySelector('#x').
  if (root && typeof root.getElementById !== 'function') {
    root.getElementById = function(id){ return root.querySelector('#' + ((window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id))); };
  }
  var R = (typeof Resonant === 'function') ? new Resonant({ rootElement: root, bindToWindow: false }) : null;
  var ChartLib = (typeof Chart !== 'undefined') ? Chart : undefined;
  var moduleJs = ${jsLiteral};
  // Match live-mount.js: full escaping (\`&\` too) into the shared .cm-live-err block.
  var showErr = function(e){
    var t = String(e && e.message || e).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    root.insertAdjacentHTML('beforeend', '<pre class="cm-live-err">'+t+'</pre>');
  };
  // Same store rules as the inline chat mount: a module that declares its own
  // \`store\` binding keeps the legacy synchronous mount; with a store the body
  // runs as an async IIFE so top-level \`await store.get(...)\` works.
  var ad = ${configJson};
  // Chart was requested but its script never loaded (file:// fallback, offline
  // base): surface ONE clear message and do NOT run the module, exactly as
  // live-mount.js does.
  if (ad.wantsChart && ChartLib === undefined) {
    showErr(new Error('Chart.js could not be loaded on this surface, so this module was not run.'));
    return;
  }
  var ownStore = /\\b(?:let|const|var|function|class)\\s+store\\b/.test(moduleJs);
  var ownLuma = /\\b(?:let|const|var|function|class)\\s+luma\\b/.test(moduleJs);
  var store = null;
  if (ad.endpoint != null && window.LumaArtifactData && !ownStore) {
    try {
      store = window.LumaArtifactData.create({ rootId: ad.rootId, transport: {
        kind: 'http', base: ad.endpoint, readOnly: ad.readOnly, pollMs: ad.pollMs } });
    } catch (e) { store = null; }
  }
  // Host page-API bridge (the injected \`luma\`): HTTP shim over the gateway's
  // /artifacts/api routes. Same module-facing contract as live-mount's
  // makeLuma: methods return the useful value and THROW on failure. Absent
  // (null) when this doc was rendered for a surface without an endpoint.
  var luma = null;
  if (ad.apiEndpoint && !ownLuma) {
    var lumaCall = function (path, body) {
      return fetch(ad.apiEndpoint + path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify(body),
      }).then(function (r) {
        return r.json().catch(function () { return null; }).then(function (b) {
          if (!b || b.success === false) throw new Error((b && b.error) || ('HTTP ' + r.status));
          return b;
        });
      });
    };
    luma = {
      fetchPage: function (url, opts) {
        var o = opts || {};
        return lumaCall('/fetch', { url: url, mode: o.mode, timeoutMs: o.timeoutMs, maxChars: o.maxChars })
          .then(function (b) { return b.content != null ? String(b.content) : ''; });
      },
      openTab: function (url) {
        return lumaCall('/open-tab', { url: url }).then(function () { return true; });
      },
    };
  }
  // Bind \`store\`/\`luma\` even when this surface has neither, so the
  // feature-detection the tool contract teaches (\`if (luma) { ... }\`) reads a
  // null instead of throwing ReferenceError. Only a name the module declares
  // itself is left unbound (redeclaring a parameter throws). Modules with no
  // bridge at all keep the legacy SYNCHRONOUS mount.
  var params = ['root', 'R', 'Chart'];
  var args = [root, R, ChartLib];
  if (!ownStore) { params.push('store'); args.push(store); }
  if (!ownLuma) { params.push('luma'); args.push(luma); }
  try {
    if (store || luma) {
      var fn = Function.apply(null, params.concat(['return (async () => {\\n' + moduleJs + '\\n})();']));
      var p = fn.apply(null, args);
      if (p && typeof p.catch === 'function') p.catch(showErr);
    } else {
      Function.apply(null, params.concat([moduleJs])).apply(null, args);
    }
  } catch (e) { showErr(e); }
})();
</script>`;
  }
}

module.exports = LiveModuleDocument;
