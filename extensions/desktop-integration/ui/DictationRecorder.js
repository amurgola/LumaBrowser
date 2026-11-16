import MicCapture from '../../../core/llm-server/ui/js/voice/MicCapture.js';
import MicFailure from '../../../core/llm-server/ui/js/voice/MicFailure.js';
import WavEncoder from '../../../core/llm-server/ui/js/voice/WavEncoder.js';

export default class DictationRecorder {
  static START_CHANNEL = 'ext.desktop-integration.dictation.start';
  static STOP_CHANNEL = 'ext.desktop-integration.dictation.stop';
  static CANCEL_CHANNEL = 'ext.desktop-integration.dictation.cancel';
  static REPORT_CHANNEL = 'ext.desktop-integration.dictationReport';

  constructor({ mic = null } = {}) {
    this._mic = mic;
    this._ipc = null;
    this._recording = null;
    this._detach = [];
  }

  activate(ipc) {
    if (!ipc || typeof ipc.on !== 'function') return;
    this._ipc = ipc;
    this._detach.push(ipc.on(DictationRecorder.START_CHANNEL, (msg) => this.start(msg)));
    this._detach.push(ipc.on(DictationRecorder.STOP_CHANNEL, (msg) => this.stop(msg)));
    this._detach.push(ipc.on(DictationRecorder.CANCEL_CHANNEL, () => this.cancel()));
  }

  deactivate() {
    for (const detach of this._detach) { if (typeof detach === 'function') { try { detach(); } catch (_) {} } }
    this._detach = [];
    this.cancel();
    this._ipc = null;
  }

  async start(msg) {
    if (!msg || !msg.sessionId) return;
    this.cancel();
    const recording = { id: msg.sessionId, frames: [] };
    this._recording = recording;
    try {
      await this._ensureMic().start((frame) => recording.frames.push(new Float32Array(frame)));
    } catch (err) {
      if (this._recording === recording) this._recording = null;
      this._report({ sessionId: recording.id, type: 'failed', error: MicFailure.message(err) });
      return;
    }
    if (this._recording !== recording) {
      if (!this._recording) this._mic.stop();
      return;
    }
    this._report({ sessionId: recording.id, type: 'started' });
  }

  stop(msg) {
    const recording = this._recording;
    if (!recording || !msg || msg.sessionId !== recording.id) return;
    this._recording = null;
    const sampleRate = this._mic.sampleRate;
    this._mic.stop();
    const samples = recording.frames.reduce((total, frame) => total + frame.length, 0);
    this._report({
      sessionId: recording.id,
      type: 'audio',
      wav: WavEncoder.encode(recording.frames, sampleRate),
      durationMs: Math.round((samples / sampleRate) * 1000),
    });
  }

  cancel() {
    if (!this._recording) return;
    this._recording = null;
    if (this._mic) this._mic.stop();
  }

  _report(update) {
    if (!this._ipc || typeof this._ipc.invoke !== 'function') return;
    try {
      const pending = this._ipc.invoke(DictationRecorder.REPORT_CHANNEL, update);
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch (_) {}
  }

  _ensureMic() {
    if (!this._mic) this._mic = new MicCapture();
    return this._mic;
  }
}
