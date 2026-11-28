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
                try { if (S.games.indexOf(g) < 0) S.games.push(g); } catch (_) {}
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

  // A position that is a number and not equal to itself: the game's own math made it NaN. (An object type with
  // no x or y at all is not counted.)
  function isNaNNumber(v) { return typeof v === 'number' && v !== v; }

  // The opaque pixel box of a texture frame ({ x, y, w, h, fw, fh }), cached per frame; null when the pixels
  // cannot be read (a tainted or oversized image). It is what the player sees of a sprite, margins left out.
  var trimCache = {};
  function trimOf(o) {
    var frame = o.frame, key = o.texture.key + '|' + (frame && frame.name);
    if (Object.prototype.hasOwnProperty.call(trimCache, key)) return trimCache[key];
    var box = null;
    try {
      var image = frame.source && frame.source.image, fw = frame.cutWidth, fh = frame.cutHeight;
      if (image && fw > 0 && fh > 0 && fw * fh <= 1048576) {
        var cv = document.createElement('canvas'); cv.width = fw; cv.height = fh;
        var cx = cv.getContext('2d');
        cx.drawImage(image, frame.cutX, frame.cutY, fw, fh, 0, 0, fw, fh);
        var px = cx.getImageData(0, 0, fw, fh).data;
        var minX = fw, minY = fh, maxX = -1, maxY = -1;
        for (var y = 0; y < fh; y++) {
          for (var x = 0; x < fw; x++) {
            if (px[(y * fw + x) * 4 + 3] <= 32) continue;
            if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
        if (maxX >= 0) box = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, fw: fw, fh: fh };
      }
    } catch (_) {}
    trimCache[key] = box;
    return box;
  }
  // Where the object's frame is drawn, as a world rectangle (rotation left out).
  function drawnRect(o) {
    var ox = o.originX != null ? o.originX : 0.5, oy = o.originY != null ? o.originY : 0.5;
    return { x: o.x - o.displayWidth * ox, y: o.y - o.displayHeight * oy, w: o.displayWidth, h: o.displayHeight };
  }
  function roundRect(r) { return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }; }
  function overlapArea(a, b) {
    var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    return w > 0 && h > 0 ? w * h : 0;
  }
  // An arcade body against the art the player can see: { tex, art, body } when the body reaches well past the
  // visible pixels or sits mostly beside them (the player then hits something that is not drawn), or when an
  // obstacle's art reaches well past its body (the player passes through what looks solid), else null. A moving
  // sprite with a hitbox smaller than its art is a design choice and is left alone.
  function bodyMismatch(o) {
    try {
      var b = o.body;
      if (!b || b.enable === false || !o.texture || !o.frame || !(b.width > 0) || !(b.height > 0)) return null;
      if (o.visible === false || Math.abs(o.rotation || 0) > 0.35) return null;
      var trim = trimOf(o); if (!trim) return null;
      var frameRect = drawnRect(o), sx = Math.abs(o.scaleX || 1), sy = Math.abs(o.scaleY || 1);
      var tx = o.flipX ? trim.fw - trim.x - trim.w : trim.x, ty = o.flipY ? trim.fh - trim.y - trim.h : trim.y;
      var art = { x: frameRect.x + tx * sx, y: frameRect.y + ty * sy, w: trim.w * sx, h: trim.h * sy };
      var body = { x: b.x, y: b.y, w: b.width, h: b.height };
      var over = Math.max(art.x - body.x, art.y - body.y, (body.x + body.w) - (art.x + art.w), (body.y + body.h) - (art.y + art.h));
      var bigger = body.w * body.h > art.w * art.h * 1.8 && over > 12;
      var beside = overlapArea(art, body) < body.w * body.h * 0.5 && over > 12;
      var under = Math.max(body.x - art.x, body.y - art.y, (art.x + art.w) - (body.x + body.w), (art.y + art.h) - (body.y + body.h));
      var hollow = (b.immovable === true || b.physicsType === 1) && under > 24;
      if (!bigger && !beside && !hollow) return null;
      return { tex: o.texture.key, art: roundRect(art), body: roundRect(body) };
    } catch (_) { return null; }
  }
  // How much of the camera's view the big images cover between them, measured on a 20 x 20 grid of points (two
  // images over the same half count once): { tex, covered, rect } for the first one when a scene has images of
  // backdrop size that leave much of the screen bare, else null.
  function backdropGap(kids, cam) {
    try {
      if (!cam || !(cam.width > 0) || !(cam.height > 0)) return null;
      var view = cam.width * cam.height, rects = [], first = null;
      for (var i = 0; i < kids.length; i++) {
        var o = kids[i];
        if (!o.texture || o.visible === false || !(o.displayWidth * o.displayHeight >= view * 0.5)) continue;
        var rect = drawnRect(o), sf = o.scrollFactorX != null ? o.scrollFactorX : 1;
        var onScreen = { x: rect.x - cam.scrollX * sf, y: rect.y - cam.scrollY * (o.scrollFactorY != null ? o.scrollFactorY : 1), w: rect.w, h: rect.h };
        rects.push(onScreen);
        if (!first) first = { tex: o.texture.key, rect: roundRect(onScreen) };
      }
      if (!first) return null;
      var hit = 0, grid = 20;
      for (var gy = 0; gy < grid; gy++) {
        for (var gx = 0; gx < grid; gx++) {
          var px = (gx + 0.5) * cam.width / grid, py = (gy + 0.5) * cam.height / grid;
          for (var ri = 0; ri < rects.length; ri++) {
            var r = rects[ri];
            if (px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h) { hit++; break; }
          }
        }
      }
      var covered = hit / (grid * grid);
      if (covered >= 0.85) return null;
      first.covered = Math.round(covered * 100) / 100;
      return first;
    } catch (_) { return null; }
  }
  // A textured object more than a whole screen outside the camera's view: { tex, x, y }, else null. Objects that
  // just left an edge (a scroller's pillars waiting to be removed) are inside that margin and do not count.
  function strayObject(o, cam) {
    try {
      if (!cam || !o.texture || !o.texture.key || o.visible === false || typeof o.text === 'string') return null;
      if (isNaNNumber(o.x) || isNaNNumber(o.y)) return null;
      var sx = o.x - cam.scrollX * (o.scrollFactorX != null ? o.scrollFactorX : 1);
      var sy = o.y - cam.scrollY * (o.scrollFactorY != null ? o.scrollFactorY : 1);
      if (sx >= -cam.width && sx <= cam.width * 2 && sy >= -cam.height && sy <= cam.height * 2) return null;
      return { tex: o.texture.key, x: Math.round(o.x), y: Math.round(o.y) };
    } catch (_) { return null; }
  }
  // The strings of the visible text objects, containers included (a game-over panel keeps its text in one).
  function collectTexts(kids, out) {
    for (var i = 0; i < kids.length && out.length < 12; i++) {
      var o = kids[i];
      if (!o || o.visible === false || o.alpha === 0) continue;
      if (o.list && o.list.length) collectTexts(o.list, out);
      else if (typeof o.text === 'string' && o.text.replace(/\\s+/g, '')) out.push(o.text.replace(/\\s+/g, ' ').slice(0, 40));
    }
    return out;
  }
  window.__lumaSmokeTexts = function () {
    var out = [];
    try {
      for (var gi = 0; gi < S.games.length; gi++) {
        var active = S.games[gi].scene && S.games[gi].scene.getScenes ? S.games[gi].scene.getScenes(true) : [];
        for (var si = 0; si < active.length; si++) collectTexts(active[si].children && active[si].children.list ? active[si].children.list : [], out);
      }
    } catch (_) {}
    return JSON.stringify(out);
  };

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
          var visible = 0, byType = {}, texKeys = {}, nanCount = 0, bodies = [], strays = [], strayCount = 0;
          for (var ki = 0; ki < kids.length; ki++) {
            var k = kids[ki];
            var stray = strayObject(k, cam);
            if (stray) { strayCount++; if (strays.length < 3) strays.push(stray); }
            var mismatch = bodies.length < 6 ? bodyMismatch(k) : null;
            if (mismatch) bodies.push(mismatch);
            if (isNaNNumber(k.x) || isNaNNumber(k.y)) nanCount++;
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
                nan: isNaNNumber(o.x) || isNaNNumber(o.y),
                alpha: o.alpha, visible: o.visible !== false,
                w: o.displayWidth != null ? Math.round(o.displayWidth) : (o.width != null ? Math.round(o.width) : null),
                h: o.displayHeight != null ? Math.round(o.displayHeight) : (o.height != null ? Math.round(o.height) : null),
                sf: o.scrollFactorX != null ? o.scrollFactorX : null,
                tex: typeof o.text === 'string' ? 'text:' + o.text.slice(0, 24) : (o.texture && o.texture.key ? o.texture.key : null),
                kids: o.list ? o.list.length : null
              });
            } catch (_) {}
          }
          info.scenes.push({
            key: sc.scene ? sc.scene.key : '?',
            objects: kids.length, visible: visible, nan: nanCount, byType: byType,
            textures: Object.keys(texKeys),
            list: objs,
            bodies: bodies,
            strays: strays,
            strayCount: strayCount,
            backdrop: backdropGap(kids, cam),
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
