const { EventEmitter } = require('events');
const crypto = require('crypto');
const ModelQueue = require('./ModelQueue');

class LLMQueueManager extends EventEmitter {
  static DEFAULT_CONCURRENCY = 4;

  constructor() {
    super();
    this._queues = new Map();
  }

  registerModel(modelId, maxConcurrency = LLMQueueManager.DEFAULT_CONCURRENCY) {
    if (this._queues.has(modelId)) return;
    this._queues.set(modelId, new ModelQueue(modelId, maxConcurrency));
    this.emit('queue-registered', { modelId, maxConcurrency });
  }

  setConcurrency(modelId, maxConcurrency) {
    const queue = this._queues.get(modelId);
    if (!queue) return;
    queue.maxConcurrency = maxConcurrency;
    this._dispatch(queue);
  }

  ensureConcurrency(modelId, maxConcurrency) {
    const limit = Math.max(1, Math.floor(Number(maxConcurrency) || 1));
    if (this._queues.has(modelId)) this.setConcurrency(modelId, limit);
    else this.registerModel(modelId, limit);
    this._emitStats(this._queues.get(modelId));
  }

  enqueue(modelId, requestPayload, meta = {}, executor) {
    this.registerModel(modelId);
    const queue = this._queues.get(modelId);
    return new Promise((resolve, reject) => {
      const task = LLMQueueManager._newTask(modelId, requestPayload, meta, executor, resolve, reject);
      queue.add(task);
      this.emit('task-queued', LLMQueueManager._taskInfo(task));
      this._emitStats(queue);
      this._dispatch(queue);
    });
  }

  getSnapshot() {
    return [...this._queues.values()].map((queue) => ({
      ...queue.stats(),
      pendingTasks: queue.pendingTasks().map((task) => LLMQueueManager._taskInfo(task)),
    }));
  }

  static _newTask(modelId, payload, meta, executor, resolve, reject) {
    return {
      id: crypto.randomUUID(),
      modelId,
      payload,
      source: meta.source || 'unknown',
      label: meta.label ? String(meta.label) : null,
      executor,
      resolve,
      reject,
      status: 'queued',
      timestamp: Date.now(),
    };
  }

  static _taskInfo(task) {
    return {
      id: task.id,
      modelId: task.modelId,
      source: task.source,
      label: task.label || null,
      status: task.status,
      timestamp: task.timestamp,
      startedAt: task.startedAt || null,
    };
  }

  _dispatch(queue) {
    while (queue.hasFreeSlot()) this._start(queue, queue.takeNext());
  }

  _start(queue, task) {
    task.status = 'processing';
    task.startedAt = Date.now();
    this.emit('task-processing', LLMQueueManager._taskInfo(task));
    this._emitStats(queue);
    this._run(queue, task);
  }

  async _run(queue, task) {
    try {
      task.resolve(await task.executor(task.payload));
    } catch (error) {
      task.reject(error);
    } finally {
      this._complete(queue, task);
    }
  }

  _complete(queue, task) {
    task.status = 'completed';
    queue.finish();
    this.emit('task-completed', { ...LLMQueueManager._taskInfo(task), durationMs: Date.now() - task.startedAt });
    this._emitStats(queue);
    this._dispatch(queue);
  }

  _emitStats(queue) {
    this.emit('queue-stats', queue.stats());
  }
}

module.exports = LLMQueueManager;
