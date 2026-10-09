class ClientMessageParser {
  static MAX_MSG_BYTES = 64 * 1024;
  static MAX_TEXT_CHARS = 2000;
  static MAX_SDP_CHARS = 48 * 1024;
  static MAX_KEY_CHARS = 16;
  static MAX_CANDIDATE_CHARS = 512;
  static MAX_SDP_MID_CHARS = 32;
  static MAX_WHEEL_DELTA = 2000;

  static MOUSE_KINDS = new Set(['move', 'down', 'up']);
  static RTC_KINDS = new Set(['want', 'answer', 'cand', 'up', 'down']);
  static BUTTONS = new Set(['left', 'right', 'middle']);
  static NAV_ACTIONS = new Set(['back', 'forward', 'reload']);
  static MOD_MAP = { ctrl: 'control', control: 'control', shift: 'shift', alt: 'alt', meta: 'meta' };

  static parse(raw) {
    const msg = ClientMessageParser._decode(raw);
    if (!msg) return null;
    const parser = ClientMessageParser._PARSERS.get(msg.t);
    return parser ? parser(msg) : null;
  }

  static _decode(raw) {
    const str = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw == null ? '' : raw);
    if (!str || str.length > ClientMessageParser.MAX_MSG_BYTES) return null;
    let msg;
    try { msg = JSON.parse(str); } catch (_) { return null; }
    if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return null;
    return msg;
  }

  static _parsePing() {
    return { t: 'ping' };
  }

  static _parseMouse(msg) {
    if (!ClientMessageParser.MOUSE_KINDS.has(msg.k)) return null;
    const point = ClientMessageParser._point(msg);
    if (!point) return null;
    return { t: 'mouse', k: msg.k, ...point, ...ClientMessageParser._buttonAndCount(msg) };
  }

  static _parseClick(msg) {
    const point = ClientMessageParser._point(msg);
    if (!point) return null;
    return { t: 'click', ...point, ...ClientMessageParser._buttonAndCount(msg) };
  }

  static _parseWheel(msg) {
    const point = ClientMessageParser._point(msg);
    const dx = Number(msg.dx) || 0;
    const dy = Number(msg.dy) || 0;
    if (!point) return null;
    if (!dx && !dy) return null;
    return { t: 'wheel', ...point, dx: ClientMessageParser._boundDelta(dx), dy: ClientMessageParser._boundDelta(dy) };
  }

  static _parseKey(msg) {
    const key = typeof msg.key === 'string' ? msg.key : '';
    if (!key || key.length > ClientMessageParser.MAX_KEY_CHARS) return null;
    return { t: 'key', key, mods: ClientMessageParser._modifiers(msg.mods) };
  }

  static _parseText(msg) {
    const s = typeof msg.s === 'string' ? msg.s : '';
    if (!s) return null;
    return { t: 'text', s: s.slice(0, ClientMessageParser.MAX_TEXT_CHARS) };
  }

  static _parseNav(msg) {
    if (!ClientMessageParser.NAV_ACTIONS.has(msg.a)) return null;
    return { t: 'nav', a: msg.a };
  }

  static _parseRtc(msg) {
    if (!ClientMessageParser.RTC_KINDS.has(msg.k)) return null;
    const out = { t: 'rtc', k: msg.k };
    if (msg.k === 'answer') {
      if (!ClientMessageParser._validSdp(msg.sdp)) return null;
      out.sdp = msg.sdp;
    }
    if (msg.k === 'cand') {
      const cand = ClientMessageParser._candidate(msg.cand);
      if (!cand) return null;
      out.cand = cand;
    }
    return out;
  }

  static _validSdp(sdp) {
    return typeof sdp === 'string' && !!sdp && sdp.length <= ClientMessageParser.MAX_SDP_CHARS;
  }

  static _candidate(c) {
    if (!c || typeof c !== 'object' || typeof c.candidate !== 'string') return null;
    if (c.candidate.length > ClientMessageParser.MAX_CANDIDATE_CHARS) return null;
    return {
      candidate: c.candidate,
      sdpMid: typeof c.sdpMid === 'string' ? c.sdpMid.slice(0, ClientMessageParser.MAX_SDP_MID_CHARS) : null,
      sdpMLineIndex: Number.isInteger(c.sdpMLineIndex) ? c.sdpMLineIndex : null,
    };
  }

  static _point(msg) {
    const x = ClientMessageParser._clamp01(Number(msg.x));
    const y = ClientMessageParser._clamp01(Number(msg.y));
    return x == null || y == null ? null : { x, y };
  }

  static _buttonAndCount(msg) {
    return { b: ClientMessageParser.BUTTONS.has(msg.b) ? msg.b : 'left', cc: msg.cc === 2 ? 2 : 1 };
  }

  static _modifiers(mods) {
    if (!Array.isArray(mods)) return [];
    const mapped = mods.map((m) => ClientMessageParser.MOD_MAP[String(m).toLowerCase()]).filter(Boolean);
    return [...new Set(mapped)];
  }

  static _boundDelta(d) {
    const max = ClientMessageParser.MAX_WHEEL_DELTA;
    return Math.max(-max, Math.min(max, d));
  }

  static _clamp01(v) {
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null;
  }

  static _PARSERS = new Map([
    ['ping', ClientMessageParser._parsePing],
    ['mouse', ClientMessageParser._parseMouse],
    ['click', ClientMessageParser._parseClick],
    ['wheel', ClientMessageParser._parseWheel],
    ['key', ClientMessageParser._parseKey],
    ['text', ClientMessageParser._parseText],
    ['nav', ClientMessageParser._parseNav],
    ['rtc', ClientMessageParser._parseRtc],
  ]);
}

module.exports = ClientMessageParser;
