const AssetJob = require('./AssetJob');
const ImageCapability = require('./ImageCapability');
const InlineAssetGenerator = require('./InlineAssetGenerator');
const CoreRequire = require('../CoreRequire');

class AssetRenderQueue {
  static TOOL = 'generate_asset';
  static BATCH_PREFIX = 'game-assets-';
  static PENDING = 'pending';
  static PLACEHOLDER = 'placeholder';
  static NOT_READY = 'image generation is not set up on this machine';

  constructor({ chat, conversationId, session, onSettled = () => {}, tasks = AssetRenderQueue.coreTasks(), lane = AssetRenderQueue._mediaLane() }) {
    this._chat = chat;
    this._conversationId = conversationId;
    this._session = session;
    this._onSettled = onSettled;
    this._tasks = tasks;
    this._lane = lane;
  }

  static coreTasks() {
    return CoreRequire.load('llm-server/chat/tasks/BackgroundTasks').shared;
  }

  enqueue(spec, modelRef, emit) {
    const session = this._session();
    AssetJob.mark(session, spec.rel, AssetRenderQueue.PENDING, emit);
    const state = { rendering: false };
    const task = this._tasks.start({
      conversationId: this._conversationId,
      batchId: AssetRenderQueue.BATCH_PREFIX + this._conversationId,
      tool: AssetRenderQueue.TOOL,
      title: spec.rel,
      lane: this._lane,
      quiet: true,
      run: (sink) => this._render({ spec, modelRef, emit, sink, state }),
      stop: () => this._abort(state),
    });
    session.assetTasks.set(spec.rel, task.id);
    return task;
  }

  static reconcile(session, tasks = AssetRenderQueue.coreTasks()) {
    if (!session || !session.assetTasks) return false;
    let changed = false;
    for (const [rel, taskId] of session.assetTasks) {
      const task = tasks.get(taskId);
      if (task && task.endedAt == null) continue;
      session.assetTasks.delete(rel);
      const asset = session.assets.get(rel);
      if (!asset || asset.status !== AssetRenderQueue.PENDING) continue;
      session.assets.set(rel, { status: AssetRenderQueue.PLACEHOLDER });
      changed = true;
    }
    return changed;
  }

  cancelAll() {
    for (const task of this._unfinished()) this._tasks.stop(task.id);
  }

  _unfinished() {
    return this._tasks.listFor(this._conversationId)
      .filter((task) => task.tool === AssetRenderQueue.TOOL && task.endedAt == null);
  }

  async _render({ spec, modelRef, emit, sink, state }) {
    const session = this._session();
    if (!ImageCapability.isReady(this._chat)) return this._keepPlaceholder(session, spec, emit);
    const exclusive = !ImageCapability.canGenerateInline(this._chat);
    if (exclusive) await ImageCapability.beginExclusive(this._chat);
    state.rendering = true;
    try {
      sink.report({ detail: modelRef ? `rendering on ${modelRef}` : 'rendering' });
      const rendered = await InlineAssetGenerator.generate({
        chat: this._chat, s: session, spec, modelRef, emit,
        onProgress: (progress) => sink.report({ step: progress.step, totalSteps: progress.totalSteps }),
      });
      return AssetRenderQueue._result(spec, rendered);
    } finally {
      state.rendering = false;
      if (exclusive) ImageCapability.endExclusive(this._chat);
      session.assetTasks.delete(spec.rel);
      this._tellSettled();
    }
  }

  _keepPlaceholder(session, spec, emit) {
    AssetJob.mark(session, spec.rel, AssetRenderQueue.PLACEHOLDER, emit);
    session.assetTasks.delete(spec.rel);
    this._tellSettled();
    return { success: false, error: AssetRenderQueue.NOT_READY };
  }

  _abort(state) {
    if (state.rendering && this._chat && typeof this._chat.abortImage === 'function') this._chat.abortImage();
  }

  _tellSettled() {
    try { this._onSettled(); } catch (_) {}
  }

  static _result(spec, rendered) {
    if (rendered.status === 'done') return { success: true, message: `${spec.rel} generated${rendered.notes ? ` (${rendered.notes})` : ''}` };
    return { success: false, error: rendered.error || `${spec.rel}: generation failed, the placeholder stands` };
  }

  static _mediaLane() {
    return CoreRequire.load('llm-server/chat/tasks/BackgroundTaskRules').MEDIA_LANE;
  }
}

module.exports = AssetRenderQueue;
