const TurnMilestones = require('./TurnMilestones');

class PlacementTestTurn {
  constructor({ router, modelRef, artifactStore, emit, clock = Date.now }) {
    this._router = router;
    this._modelRef = modelRef;
    this._artifactStore = artifactStore;
    this._emit = emit;
    this._clock = clock;
  }

  run(label, userMessage, conversationId) {
    return new Promise((resolve) => {
      this._setupTurn(label, conversationId, resolve);
      this._emit('status', { phase: 'run', label });
      this._dispatch(userMessage, conversationId);
    });
  }

  _setupTurn(label, conversationId, resolve) {
    this._label = label;
    this._startedAt = this._clock();
    this._convId = conversationId || null;
    this._artifactId = null;
    this._settled = false;
    this._milestones = new TurnMilestones();
    this._resolve = resolve;
  }

  _dispatch(userMessage, conversationId) {
    this._router.chat({
      conversationId, modelRef: this._modelRef,
      messages: [{ role: 'user', content: userMessage }],
      userMessage, agent: true, tools: true, send: (type, payload) => this._onEvent(type, payload),
    }).then((res) => {
      if (res && res.conversationId) this._convId = res.conversationId;
      if (res && res.success === false) this._finish(res.error || 'chat failed');
    }).catch((err) => this._finish((err && err.message) || 'chat failed'));
  }

  _onEvent(type, payload) {
    if (type === 'meta' && payload && payload.conversationId) this._convId = payload.conversationId;
    else if (type === 'status') this._onStatus(payload);
    else if (type === 'tool') this._milestones.markProgress(payload, this._clock());
    else if (type === 'artifact') this._onArtifact(payload);
    else if (type === 'done') this._onDone(payload);
    else if (type === 'error') this._finish((payload && payload.message) || 'turn failed');
  }

  _onStatus(payload) {
    this._milestones.markToolStart(this._clock());
    this._emit('status', { phase: payload && payload.phase, label: this._label });
  }

  _onArtifact(payload) {
    if (payload && payload.id && (!payload.type || payload.type === 'image')) this._artifactId = payload.id;
  }

  _onDone(payload) {
    if (payload && payload.conversationId) this._convId = payload.conversationId;
    this._finish(payload && payload.aborted ? 'aborted' : null);
  }

  _finish(errorMessage) {
    if (this._settled) return;
    this._settled = true;
    const endedAt = this._clock();
    if (!this._artifactId) this._artifactId = this._lastImageArtifact();
    const step = this._buildStep(errorMessage, endedAt);
    this._emit('step', step);
    this._resolve({ step, convId: this._convId, imageId: this._artifactId, error: errorMessage || null });
  }

  _buildStep(errorMessage, endedAt) {
    return {
      label: this._label,
      ms: endedAt - this._startedAt,
      artifactId: this._artifactId,
      ok: !!this._artifactId && !errorMessage,
      error: errorMessage || null,
      timing: this._milestones.timing(this._startedAt, endedAt),
    };
  }

  _lastImageArtifact() {
    try {
      const list = this._artifactStore && this._convId ? this._artifactStore.list(this._convId) : [];
      const images = (list || []).filter((a) => a.type === 'image');
      return images.length ? images[images.length - 1].id : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = PlacementTestTurn;
