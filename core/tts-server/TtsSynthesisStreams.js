const SenderStream = require('../shared/ipc/SenderStream');
const VoiceChannels = require('../shared/ipc/VoiceChannels');

class TtsSynthesisStreams {
  constructor(service) {
    this._service = service;
    this._active = new Map();
  }

  start(event, args = {}) {
    const requestId = String(args.requestId || `tts-req-${Date.now()}`);
    const emit = SenderStream.create(event, VoiceChannels.TTS_STREAM_CHANNEL, { requestId });
    const handle = this._service.synthesize(
      { text: args.text, sid: args.sid, speed: args.speed },
      (chunk) => emit('chunk', chunk),
    );
    this._track(requestId, handle, emit);
    return { requestId };
  }

  abort(requestId) {
    const id = this._active.get(String(requestId));
    if (id != null) this._service.cancel(id);
    return { found: id != null };
  }

  _track(requestId, handle, emit) {
    this._active.set(requestId, handle.id);
    handle.done
      .then((result) => emit('done', { canceled: !!(result && result.canceled) }))
      .catch((err) => emit('error', { message: err.message }))
      .finally(() => this._active.delete(requestId));
  }
}

module.exports = TtsSynthesisStreams;
