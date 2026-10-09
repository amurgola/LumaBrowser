const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');

class TaskBroadcast {
  constructor({ ipc, repository, send = (channel, payload) => RendererBroadcast.send(channel, payload) }) {
    this._channel = ipc ? `${ipc.namespace}.changed` : null;
    this._repository = repository;
    this._send = send;
  }

  emit(reason, taskId) {
    if (!this._channel) return;
    this._send(this._channel, { reason, taskId: taskId || null, task: this._task(taskId) });
  }

  _task(taskId) {
    if (!taskId) return null;
    try { return this._repository.get(taskId); } catch (_) { return null; }
  }
}

module.exports = TaskBroadcast;
