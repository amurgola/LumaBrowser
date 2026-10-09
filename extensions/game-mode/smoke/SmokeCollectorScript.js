class SmokeCollectorScript {
  static source(runMs, actions = []) {
    const actionsJson = JSON.stringify(actions).replace(/`/g, '\\x60').replace(/<\//g, '<\\/');
    return `(function () {
  var S = window.__lumaSmoke = { errors: [], warnings: [], logs: [], resources: [], inputs: 0, frames: 0, games: [], actionsRun: 0 };
  (function countFrames() { S.frames++; requestAnimationFrame(countFrames); })();
  function push(list, e, cap) {
    var key = String(e.message || e.url || '') + '|' + String(e.source || '') + '|' + (e.line || 0);
    for (var i = 0; i < list.length; i++) { if (list[i].key === key) { list[i].count++; return; } }
    if (list.length >= (cap || 30)) return;
    e.key = key; e.count = 1; list.push(e);
  }
  window.addEventListener('error', function (e) {
    try {
      if (e && e.target && e.target !== window && (e.target.src || e.target.href)) {
        push(S.resources, { url: String(e.target.src || e.target.href).slice(0, 300) });
        return;
      }
      push(S.errors, {
        message: String((e && e.message) || (e && e.error && e.error.message) || 'unknown error'),
        source: String((e && e.filename) || ''),
        line: (e && e.lineno) || 0,
        col: (e && e.colno) || 0,
        stack: e && e.error && e.error.stack ? String(e.error.stack).slice(0, 2000) : ''
      });
    } catch (_) {}
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    try {
      var r = e && e.reason;
      push(S.errors, {
        message: 'Unhandled promise rejection: ' + String((r && r.message) || r),
        source: '', line: 0, col: 0,
        stack: r && r.stack ? String(r.stack).slice(0, 2000) : ''
      });
    } catch (_) {}
  });
  function joinArgs(args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      if (a && a.stack) parts.push(String(a.stack).split('\\n')[0]);
      else if (a && typeof a === 'object') { try { parts.push(JSON.stringify(a).slice(0, 200)); } catch (_) { parts.push(String(a)); } }
      else parts.push(String(a));
    }
    return parts.join(' ').slice(0, 500);
  }
  var origError = console.error, origWarn = console.warn, origLog = console.log, origInfo = console.info;
  console.error = function () {
    try { push(S.errors, { message: joinArgs(arguments), source: 'console.error', line: 0, col: 0, stack: '' }); } catch (_) {}
    return origError.apply(console, arguments);
  };
  console.warn = function () {
    try { push(S.warnings, { message: joinArgs(arguments) }, 10); } catch (_) {}
    return origWarn.apply(console, arguments);
  };
  function logTap(orig) {
    return function () {
      try { push(S.logs, { message: joinArgs(arguments) }, 40); } catch (_) {}
      return orig.apply(console, arguments);
    };
  }
  console.log = logTap(origLog);
  console.info = logTap(origInfo);

  // Trap the Phaser.Game instance the moment the engine attaches to window:
  // Phaser's UMD assigns window.Phaser, so an accessor here sees it land.
  (function trapPhaser() {
    var real;
    try {
      Object.defineProperty(window, 'Phaser', {
        configurable: true, enumerable: true,
        get: function () { return real; },
        set: function (v) {
          real = v;
          try {
            if (v && typeof v.Game === 'function') {
              var Orig = v.Game;
              var Wrapped = new Proxy(Orig, { construct: function (T, args, N) {
                var g = Reflect.construct(T, args, N);
                try { S.games.push(g); } catch (_) {}
                return g;
              } });
              v.Game = Wrapped;
            }
          } catch (_) {}
        }
      });
    } catch (_) {}
  })();

  function canvasEl() { return document.querySelector('canvas'); }
  function toClient(x, y) {
    var c = canvasEl(); if (!c) return null;
    var r = c.getBoundingClientRect();
    var sx = c.width ? r.width / c.width : 1, sy = c.height ? r.height / c.height : 1;
    return { x: r.left + x * sx, y: r.top + y * sy };
  }
  function mouseAt(type, buttons, cx, cy) {
    var c = canvasEl(); if (!c) return;
    c.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: buttons, clientX: cx, clientY: cy }));
  }
  function keyEv(type, key, code, keyCode) {
    var ev = new KeyboardEvent(type, { key: key, code: code, bubbles: true, cancelable: true });
    try {
      Object.defineProperty(ev, 'keyCode', { get: function () { return keyCode; } });
      Object.defineProperty(ev, 'which', { get: function () { return keyCode; } });
    } catch (_) {}
    return ev;
  }
  function pressKey(key, code, keyCode, holdMs) {
    // Press... and release LATER, never in the same tick: Key.onUp clears
    // _justDown, so a same-tick keyup erases the press before any scene
    // update() can see it.
    window.dispatchEvent(keyEv('keydown', key, code, keyCode));
    setTimeout(function () { try { window.dispatchEvent(keyEv('keyup', key, code, keyCode)); } catch (_) {} }, holdMs || 120);
  }
  function clickAt(x, y) {
    var p = toClient(x, y); if (!p) return;
    // Phaser listens for mousedown/mouseup (not pointer events); hover first
    // so pointerover handlers on buttons see the cursor arrive.
    mouseAt('mousemove', 0, p.x, p.y);
    mouseAt('mousedown', 1, p.x, p.y);
    setTimeout(function () { try { mouseAt('mouseup', 0, p.x, p.y); } catch (_) {} }, 90);
  }
  function typeText(text) {
    for (var i = 0; i < text.length; i++) {
      (function (ch, idx) {
        setTimeout(function () {
          try {
            var kc = ch === ' ' ? 32 : ch.toUpperCase().charCodeAt(0);
            var code = /[a-z]/i.test(ch) ? 'Key' + ch.toUpperCase() : (ch === ' ' ? 'Space' : ch);
            pressKey(ch, code, kc, 40);
          } catch (_) {}
        }, idx * 55);
      })(text[i], i);
    }
  }
  var ACTIONS = ${actionsJson};
  function tap() {
    try {
      pressKey(' ', 'Space', 32, 120);
      var c = canvasEl();
      if (c) { var r = c.getBoundingClientRect(); mouseAt('mousedown', 1, r.left + r.width / 2, r.top + r.height / 2);
        setTimeout(function () { try { mouseAt('mouseup', 0, r.left + r.width / 2, r.top + r.height / 2); } catch (_) {} }, 120); }
      S.inputs++;
    } catch (_) { /* synthetic input must never add errors of its own */ }
  }
  if (ACTIONS.length) {
    for (var ai = 0; ai < ACTIONS.length; ai++) {
      (function (a) {
        setTimeout(function () {
          try {
            if (a.type === 'click') clickAt(a.x, a.y);
            else if (a.type === 'key') pressKey(a.key, a.code, a.keyCode, a.holdMs);
            else if (a.type === 'type') typeText(a.text);
            S.inputs++; S.actionsRun++;
          } catch (_) {}
        }, a.at);
      })(ACTIONS[ai]);
    }
  } else {
    setTimeout(function () {
      tap();
      var iv = setInterval(tap, 700);
      setTimeout(function () { clearInterval(iv); }, ${Math.max(0, runMs - 1200)});
    }, 900);
  }

  function probeGames() {
    var out = [];
    for (var gi = 0; gi < S.games.length; gi++) {
      var g = S.games[gi];
      try {
        var info = { renderer: g.renderer && g.renderer.type === 2 ? 'webgl' : 'canvas', scenes: [], textures: [], missing: [] };
        var active = g.scene && g.scene.getScenes ? g.scene.getScenes(true) : [];
        for (var si = 0; si < active.length; si++) {
          var sc = active[si];
          var cam = sc.cameras && sc.cameras.main;
          var kids = sc.children && sc.children.list ? sc.children.list : [];
          var visible = 0, byType = {}, texKeys = {};
          for (var ki = 0; ki < kids.length; ki++) {
            var k = kids[ki];
            if (k.visible !== false && (k.alpha == null || k.alpha > 0)) visible++;
            var t = k.type || 'Object'; byType[t] = (byType[t] || 0) + 1;
            if (k.texture && k.texture.key) texKeys[k.texture.key] = true;
          }
          // Per-object geometry for the first objects on the list: enough to
          // see "the image is 0 wide", "the text is at (1200, 900)", "alpha 0".
          var objs = [];
          for (var oi = 0; oi < kids.length && objs.length < 30; oi++) {
            var o = kids[oi];
            try {
              objs.push({
                type: o.type || 'Object', x: Math.round(o.x), y: Math.round(o.y), depth: o.depth,
                alpha: o.alpha, visible: o.visible !== false,
                w: o.displayWidth != null ? Math.round(o.displayWidth) : (o.width != null ? Math.round(o.width) : null),
                h: o.displayHeight != null ? Math.round(o.displayHeight) : (o.height != null ? Math.round(o.height) : null),
                sf: o.scrollFactorX != null ? o.scrollFactorX : null,
                tex: o.texture && o.texture.key ? o.texture.key : (o.text != null ? 'text:' + String(o.text).slice(0, 24) : null),
                kids: o.list ? o.list.length : null
              });
            } catch (_) {}
          }
          info.scenes.push({
            key: sc.scene ? sc.scene.key : '?',
            objects: kids.length, visible: visible, byType: byType,
            textures: Object.keys(texKeys),
            list: objs,
            camera: cam ? { x: cam.x, y: cam.y, width: cam.width, height: cam.height,
              scrollX: Math.round(cam.scrollX), scrollY: Math.round(cam.scrollY), zoom: cam.zoom, alpha: cam.alpha,
              fade: cam.fadeEffect ? { running: !!cam.fadeEffect.isRunning, alpha: cam.fadeEffect.alpha, complete: !!cam.fadeEffect.isComplete } : null } : null
          });
        }
        var list = g.textures && g.textures.list ? g.textures.list : {};
        for (var key in list) {
          if (key === '__DEFAULT' || key === '__MISSING' || key === '__WHITE' || key === '__NORMAL' || key === '__BASE') continue;
          var tex = list[key]; var src = tex && tex.source && tex.source[0];
          info.textures.push(key + (src ? ' ' + src.width + 'x' + src.height : ''));
        }
        for (var s2 = 0; s2 < info.scenes.length; s2++) {
          for (var t2 = 0; t2 < info.scenes[s2].textures.length; t2++) {
            var tk = info.scenes[s2].textures[t2];
            if (tk === '__MISSING' || !list[tk]) info.missing.push(tk);
          }
        }
        out.push(info);
      } catch (e) { out.push({ error: String(e && e.message || e) }); }
    }
    return out;
  }
  window.__lumaSmokeCanvasRect = function () {
    var c = canvasEl(); if (!c) return 'null';
    var r = c.getBoundingClientRect();
    return JSON.stringify({ x: r.left, y: r.top, w: r.width, h: r.height, cw: c.width, ch: c.height, dpr: window.devicePixelRatio || 1 });
  };
  window.__lumaSmokeReport = function () {
    function strip(list) {
      var out = [];
      for (var i = 0; i < list.length; i++) {
        var e = {}; for (var k in list[i]) { if (k !== 'key') e[k] = list[i][k]; }
        out.push(e);
      }
      return out;
    }
    var c = canvasEl();
    return JSON.stringify({
      errors: strip(S.errors),
      warnings: strip(S.warnings).slice(0, 5),
      logs: strip(S.logs),
      resources: strip(S.resources),
      inputs: S.inputs,
      actionsRun: S.actionsRun,
      frames: S.frames,
      visibility: document.visibilityState,
      canvas: c ? { width: c.width, height: c.height } : null,
      games: probeGames()
    });
  };
})();
//# sourceURL=__smoke__.js`;
  }

  static inject(html, collector) {
    const tag = `<script>${collector}</script>`;
    if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${tag}`);
    return `${tag}\n${html}`;
  }
}

module.exports = SmokeCollectorScript;
