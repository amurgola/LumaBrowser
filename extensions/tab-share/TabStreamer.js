const { EventEmitter } = require('events');
const ClientMessageParser = require('./ClientMessageParser');
const InputEventMapper = require('./InputEventMapper');
const TabFrameGrabber = require('./TabFrameGrabber');
const TabInputSink = require('./TabInputSink');
const TabViewer = require('./TabViewer');

class TabStreamer extends EventEmitter {
  static ACTIVE_INTERVAL_MS = 100;
  static IDLE_INTERVAL_MS = 400;
  static IDLE_AFTER_FRAMES = 12;
  static MAX_CLIENTS = 8;
  static CLOSE_ENDED = 4000;
  static CLOSE_REFUSED = 4001;

  constructor({ getWebContents, getView, getFallbackBounds, getMode, getMeta, log, rtc, sleep } = {}) {
    super();
    this._getMode = getMode || (() => 'view');
    this._getMeta = getMeta || (() => ({ title: '', url: '' }));
    this._log = log || (() => {});
    this._rtc = rtc || null;
    this._grabber = new TabFrameGrabber({ getWebContents, getView, getFallbackBounds });
    this._input = new TabInputSink({ getWebContents, log: this._log, sleep });
    this._viewers = new Map();
    this._destroyed = false;
    this._timer = null;
    this._capturing = false;
    this._failStreak = 0;
    this._lastJpeg = null;
    this._lastMeta = null;
    this._idleFrames = 0;
  }

  get viewerCount() {
    return this._viewers.size;
  }

  get videoViewerCount() {
    return this._allViewers().filter((v) => v.isOnVideo()).length;
  }

  addClient(ws) {
    if (this._destroyed || this._viewers.size >= TabStreamer.MAX_CLIENTS) return this._refuse(ws);
    const viewer = new TabViewer(ws);
    this._viewers.set(ws, viewer);
    this._greet(viewer);
    this._listen(viewer);
    this.emit('viewers', this._viewers.size);
    this.kick();
    return true;
  }

  removeClient(ws) {
    const viewer = this._viewers.get(ws);
    if (!viewer) return;
    this._viewers.delete(ws);
    viewer.closePeer();
    this.emit('viewers', this._viewers.size);
    if (!this._viewers.size) this.stopLoop();
  }

  rtcAvailable() {
    try { return !!(this._rtc && this._rtc.available()); } catch (_) { return false; }
  }

  broadcastMode() {
    this._broadcast({ t: 'mode', mode: this._getMode() });
  }

  broadcastMeta() {
    const meta = this._getMeta();
    this._broadcast({ t: 'meta', title: meta.title || '', url: meta.url || '' });
    this.kick();
  }

  destroy(reason = 'ended') {
    if (this._destroyed) return;
    this._destroyed = true;
    this.stopLoop();
    for (const viewer of this._viewers.values()) TabStreamer._end(viewer, reason);
    this._viewers.clear();
    this._lastJpeg = null;
    this.emit('viewers', 0);
    this.removeAllListeners();
  }

  isDestroyed() {
    return this._destroyed;
  }

  async captureOnce() {
    const frame = await this._grabber.grab();
    if (!frame) return 'skip';
    const metaChanged = this._updateMeta(frame.meta);
    if (!metaChanged && this._lastJpeg && frame.jpeg.equals(this._lastJpeg)) {
      this._idleFrames++;
      return 'same';
    }
    this._publish(frame.jpeg);
    return 'sent';
  }

  kick() {
    this._idleFrames = 0;
    if (this._destroyed || !this._frameViewers().length) return;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this._tick(), 0);
  }

  stopLoop() {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  isLoopScheduled() {
    return this._timer !== null;
  }

  inputSettled() {
    return this._input.settled();
  }


  _refuse(ws) {
    const reason = this._destroyed ? 'ended' : 'full';
    const viewer = new TabViewer(ws);
    viewer.sendJson({ t: 'ended', reason });
    viewer.close(TabStreamer.CLOSE_REFUSED, reason);
    return false;
  }

  _greet(viewer) {
    const meta = this._getMeta();
    viewer.sendJson({
      t: 'hello', mode: this._getMode(), title: meta.title || '', url: meta.url || '',
      vw: this._lastMeta ? this._lastMeta.vw : 0, vh: this._lastMeta ? this._lastMeta.vh : 0,
      rtc: this.rtcAvailable(),
    });
    if (this._lastMeta) viewer.sendJson({ t: 'frame', ...this._lastMeta });
    if (this._lastJpeg) viewer.sendFrame(this._lastJpeg);
  }

  _listen(viewer) {
    const ws = viewer.socket();
    ws.on('message', (data) => this._onMessage(viewer, data));
    const drop = () => this.removeClient(ws);
    ws.on('close', drop);
    ws.on('error', drop);
  }

  static _end(viewer, reason) {
    viewer.closePeer();
    viewer.sendJson({ t: 'ended', reason });
    viewer.close(TabStreamer.CLOSE_ENDED, reason);
  }

  _allViewers() {
    return [...this._viewers.values()];
  }

  _frameViewers() {
    return this._allViewers().filter((v) => !v.isOnVideo());
  }

  _broadcast(obj) {
    const text = JSON.stringify(obj);
    for (const viewer of this._viewers.values()) viewer.sendText(text);
  }


  _schedule() {
    if (this._destroyed || !this._frameViewers().length) return;
    const idle = this._idleFrames >= TabStreamer.IDLE_AFTER_FRAMES;
    this._timer = setTimeout(() => this._tick(), idle ? TabStreamer.IDLE_INTERVAL_MS : TabStreamer.ACTIVE_INTERVAL_MS);
    if (this._timer.unref) this._timer.unref();
  }

  async _tick() {
    this._timer = null;
    if (this._destroyed || !this._frameViewers().length || this._capturing) return;
    this._capturing = true;
    try {
      await this.captureOnce();
      this._failStreak = 0;
    } catch (err) {
      this._onCaptureFailed(err);
    } finally {
      this._capturing = false;
      this._schedule();
    }
  }

  _onCaptureFailed(err) {
    this._failStreak++;
    if (this._failStreak === 1) this._log(`capture failed: ${err && err.message}`);
    this._idleFrames = TabStreamer.IDLE_AFTER_FRAMES;
  }

  _updateMeta(meta) {
    const changed = !this._lastMeta || ['w', 'h', 'vw', 'vh'].some((k) => this._lastMeta[k] !== meta[k]);
    if (changed) {
      this._lastMeta = meta;
      this._broadcast({ t: 'frame', ...meta });
    }
    return changed;
  }

  _publish(jpeg) {
    this._lastJpeg = jpeg;
    this._idleFrames = 0;
    for (const viewer of this._frameViewers()) {
      if (!viewer.isBackedUp(jpeg.length)) viewer.sendFrame(jpeg);
    }
  }


  _onMessage(viewer, data) {
    const msg = ClientMessageParser.parse(data);
    if (!msg) return;
    if (msg.t === 'ping') { viewer.sendJson({ t: 'pong' }); return; }
    if (msg.t === 'rtc') { this._onRtc(viewer, msg); return; }
    if (!this._acceptsInputFrom(viewer)) return;
    if (msg.t === 'nav') { this._input.navigate(msg.a); this.kick(); return; }
    this._applyInput(msg);
  }

  _acceptsInputFrom(viewer) {
    if (this._getMode() !== 'interact') return false;
    if (!viewer.allowInput()) return false;
    return this._input.hasLiveTarget();
  }

  _applyInput(msg) {
    const events = InputEventMapper.toInputEvents(msg, this._inputViewSize());
    if (!events.length) return;
    this._input.enqueue(events);
    this.kick();
  }

  _inputViewSize() {
    return this._lastMeta ? { width: this._lastMeta.vw, height: this._lastMeta.vh } : this._grabber.viewSize();
  }


  _onRtc(viewer, msg) {
    switch (msg.k) {
      case 'want': this._rtcWant(viewer); return;
      case 'answer': if (viewer.hasPeer()) viewer.peer().answer(msg.sdp); return;
      case 'cand': if (viewer.hasPeer()) viewer.peer().candidate(msg.cand); return;
      case 'up': this._rtcUp(viewer); return;
      case 'down': this._rtcDown(viewer); return;
      default: return;
    }
  }

  _rtcWant(viewer) {
    if (viewer.hasPeer()) return;
    let dead = false;
    const relay = (out) => {
      if (TabStreamer._endsPeer(out)) { dead = true; this._onPeerEnded(viewer); }
      viewer.sendJson(Object.assign({ t: 'rtc' }, out));
    };
    const peer = this.rtcAvailable() && this._rtc.createPeer ? this._rtc.createPeer(relay) : null;
    if (!peer) { viewer.sendJson({ t: 'rtc', k: 'unavailable' }); return; }
    if (dead) { try { peer.close(); } catch (_) {} return; }
    viewer.attachPeer(peer);
  }

  _onPeerEnded(viewer) {
    const peer = viewer.detachPeer();
    if (peer) { try { peer.close(); } catch (_) {} }
    if (!viewer.isOnVideo()) return;
    viewer.setOnVideo(false);
    this.emit('transport', { up: false });
    this.kick();
  }

  _rtcUp(viewer) {
    if (!viewer.hasPeer()) return;
    viewer.setOnVideo(true);
    this.emit('transport', { up: true });
    if (!this._frameViewers().length) this.stopLoop();
  }

  _rtcDown(viewer) {
    viewer.setOnVideo(false);
    this.emit('transport', { up: false });
    this.kick();
  }

  static _endsPeer(out) {
    return !!out && (out.k === 'error' || (out.k === 'state' && (out.state === 'failed' || out.state === 'closed')));
  }
}

module.exports = TabStreamer;
