const DesktopKeys = require('../desktop/DesktopKeys');
const FrameHash = require('./FrameHash');
const GameControlArgs = require('./GameControlArgs');
const GameFrameWatcher = require('./GameFrameWatcher');
const GameKeyEvents = require('./GameKeyEvents');
const RelativeMovePlan = require('./RelativeMovePlan');

class GameController {
  static MOVE_TICK_MS = RelativeMovePlan.TICK_MS;
  static MAX_HOLD_MS = GameControlArgs.MAX_HOLD_MS;
  static CALIBRATION_MOVE_MS = 200;
  static CALIBRATION_MARGIN = 6;

  constructor({ desktop, sleep = GameController._realSleep, now = Date.now } = {}) {
    if (!desktop) throw new Error('GameController needs a DesktopService');
    this._desktop = desktop;
    this._sleep = sleep;
    this._now = now;
    this._watcher = new GameFrameWatcher({ frameHash: (args) => this.frameHash(args), sleep, now });
  }

  get desktop() {
    return this._desktop;
  }

  get win() {
    return this._desktop.win;
  }

  target(args = {}) {
    const gate = this._desktop.gate();
    if (gate) return { error: gate };
    const { w, error } = this._desktop.resolve(args);
    if (error) return { error };
    const refusal = this._desktop.inputRefusal(w);
    return refusal ? { error: refusal } : { w };
  }

  async pressKeys(args = {}) {
    const { w, error } = this.target(args);
    if (error) return { success: false, error };
    const seq = GameControlArgs.keySequence(args.keys);
    if (!seq.length) return { success: false, error: 'keys is empty' };
    const opts = GameControlArgs.press(args);
    try {
      return await this._pressSequence(w, seq, opts);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async holdKey(args = {}) {
    return this.pressKeys({ ...args, keys: [args.key], holdMs: GameControlArgs.holdMs(args), gapMs: 0 });
  }

  async moveMouseRelative(args = {}) {
    const { w, error } = this.target(args);
    if (error) return { success: false, error };
    const { dx, dy, durationMs } = GameControlArgs.move(args);
    if (!dx && !dy) return { success: false, error: 'dx or dy is required.' };
    const ticks = RelativeMovePlan.tickCount(durationMs);
    try {
      await this._front(w);
      await this._sendMoveChunks(w, RelativeMovePlan.chunks(dx, dy, ticks));
      return { success: true, data: { dx, dy, chunks: ticks, durationMs } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  clickUI(args = {}) {
    return this._desktop.click(args);
  }

  frameHash(args = {}) {
    const gate = this._desktop.gate();
    if (gate) return { success: false, error: gate };
    const { w, error } = this._desktop.resolve(args);
    if (error) return { success: false, error };
    try {
      const { shot, method } = this._desktop.capture(w);
      return { success: true, data: { hash: FrameHash.frameSignature(shot), method } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  diff(a, b) {
    return FrameHash.hamming(a, b);
  }

  waitForChange(args = {}) {
    return this._watcher.waitForChange(args);
  }

  waitForStill(args = {}) {
    return this._watcher.waitForStill(args);
  }

  async calibrateMouse(args = {}) {
    const { dx, settleMs } = GameControlArgs.calibrate(args);
    const idle = await this._idleNoise(args, settleMs);
    if (!idle.success) return idle;
    const moved = await this._nudgedDistance(args, dx, settleMs, idle.after);
    if (!moved.success) return moved;
    return GameController._calibrationResult(moved.distance, idle.noise);
  }

  async _pressSequence(w, seq, { mode, holdMs, gapMs }) {
    const chords = seq.map((k) => DesktopKeys.parseCombo(k));
    if (chords.length > GameControlArgs.MAX_SEQUENCE) return { success: false, error: 'At most 50 keys per call.' };
    await this._front(w);
    for (let i = 0; i < chords.length; i++) {
      if (i) await this._sleep(gapMs);
      await this._chord(w, chords[i], holdMs, mode);
    }
    return { success: true, data: { keys: seq, mode, holdMs } };
  }

  async _chord(w, vks, holdMs, mode) {
    const events = vks.map((vk) => GameKeyEvents.forKey(this.win, vk, mode));
    const pressed = [];
    try {
      for (const e of events) {
        this._desktop.send(w, [e.down]);
        pressed.push(e);
      }
      await this._sleep(holdMs);
    } finally {
      this._release(pressed.reverse().map((e) => e.up));
    }
  }

  _release(ups) {
    if (!ups.length) return;
    try { this.win.sendInputs(ups); } catch (_) {}
  }

  async _front(w) {
    if (!(await this._desktop.bringToFront(w))) throw new Error(`Could not bring "${w.title}" to the front.`);
  }

  async _sendMoveChunks(w, chunks) {
    for (let i = 0; i < chunks.length; i++) {
      const { dx, dy } = chunks[i];
      if (dx || dy) this._desktop.send(w, [this.win.relativeMoveInput(dx, dy)]);
      if (i < chunks.length - 1) await this._sleep(RelativeMovePlan.TICK_MS);
    }
  }

  async _idleNoise(args, settleMs) {
    const before = this.frameHash(args);
    if (!before.success) return before;
    await this._sleep(settleMs);
    const after = this.frameHash(args);
    if (!after.success) return after;
    return { success: true, noise: FrameHash.hamming(before.data.hash, after.data.hash), after: after.data.hash };
  }

  async _nudgedDistance(args, dx, settleMs, beforeHash) {
    const moved = await this.moveMouseRelative({ ...args, dx, dy: 0, durationMs: GameController.CALIBRATION_MOVE_MS });
    if (!moved.success) return moved;
    await this._sleep(settleMs);
    const after = this.frameHash(args);
    if (!after.success) return after;
    await this.moveMouseRelative({ ...args, dx: -dx, dy: 0, durationMs: GameController.CALIBRATION_MOVE_MS });
    return { success: true, distance: FrameHash.hamming(beforeHash, after.data.hash) };
  }

  static _calibrationResult(distance, noise) {
    const reacts = distance > noise + GameController.CALIBRATION_MARGIN;
    return {
      success: true,
      data: {
        reacts,
        distance,
        noise,
        advice: reacts
          ? 'The game reacts to relative mouse movement: game_mouse_move works here.'
          : 'The frame did not change when the mouse moved. Either this screen does not use mouse-look (menus, turn-based maps) or the game ignores injected mouse input: prefer keys and clicks.',
      },
    };
  }

  static _realSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = GameController;
