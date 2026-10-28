const CallMarkers = require('../parsing/CallMarkers');

class AgentEventRelay {
  constructor(o) {
    this._o = o;
    this._hooks = o.hooks || {};
    this.handle = (evt) => this._handle(evt);
  }

  _handle(evt) {
    if (evt.type === 'final-retracted') this._o.mirror.retractIteration();
    else if (evt.type === 'tool') this._onTool(evt);
    else if (evt.type === 'tool-result') this._onToolResult(evt);
    else if (evt.type === 'compacting' || evt.type === 'compacted') this._onCompaction(evt);
    else if (evt.type === 'final') this._onFinal();
    else if (evt.type === 'iteration') this._onIteration(evt);
  }

  _onIteration(evt) {
    const progress = this._o.progress;
    if (!progress || typeof progress.report !== 'function') return;
    try { progress.report({ conversationId: this._o.conversationId, iteration: evt.iteration, maxIterations: evt.maxIterations }); } catch (_) {}
  }

  _onTool(evt) {
    this._o.mirror.retractIteration();
    if (evt.tool === CallMarkers.MALFORMED_TOOL) return;
    this._o.trace.open(evt.tool, evt.params, evt.callId);
    if (this._hooks.onToolEvent) this._hooks.onToolEvent({ phase: 'run', tool: evt.tool, params: evt.params, ...AgentEventRelay._callFields(evt) });
  }

  static _callFields(evt) {
    const out = {};
    if (evt.callId != null) out.callId = evt.callId;
    if (evt.batchSize > 1) { out.batchSize = evt.batchSize; out.batchIndex = evt.batchIndex; }
    return out;
  }

  _onToolResult(evt) {
    if (evt.tool === CallMarkers.MALFORMED_TOOL) return;
    this._o.trace.close(evt);
    const shot = this._screenshot(evt);
    if (!this._hooks.onToolEvent) return;
    this._hooks.onToolEvent({
      phase: 'done',
      tool: evt.tool,
      success: evt.success,
      error: evt.error,
      summary: evt.summary || null,
      artifact: evt.artifact || shot || null,
      ...(evt.callId != null ? { callId: evt.callId } : {}),
    });
  }

  _screenshot(evt) {
    if (!evt.image || !evt.image.base64) return null;
    const o = this._o;
    const mime = evt.image.mime || 'image/png';
    o.images.queueToolImage({ base64: evt.image.base64, mime });
    try {
      const artifact = o.artifactStore.create({
        conversationId: o.conversationId,
        messageId: o.assistantMessageId,
        title: 'Screenshot',
        type: 'image',
        bytes: Buffer.from(evt.image.base64, 'base64'),
        mime,
      });
      o.artifacts.push(artifact);
      if (this._hooks.onArtifact) this._hooks.onArtifact(artifact);
      return artifact;
    } catch (_) {
      return null;
    }
  }

  _onCompaction(evt) {
    if (!this._hooks.onStatus) return;
    try {
      this._hooks.onStatus(evt.type === 'compacting'
        ? { phase: 'compacting', midTurn: true }
        : { phase: 'compacted', midTurn: true, removed: evt.removed, contextWindow: evt.contextWindow, reason: evt.reason });
    } catch (_) {}
  }

  _onFinal() {
    if (!this._o.mirror.toolSuppressed || !this._hooks.onToolEvent) return;
    try { this._hooks.onToolEvent({ phase: 'cancel' }); } catch (_) {}
  }
}

module.exports = AgentEventRelay;
