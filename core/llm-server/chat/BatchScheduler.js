class BatchScheduler {
  run(tasks, opts = {}) {
    if (typeof opts.runTask !== 'function') throw new Error('BatchScheduler.run requires opts.runTask');
    if (!Array.isArray(tasks) || tasks.length === 0) return Promise.resolve([]);
    const batch = BatchScheduler._createBatch(tasks, opts);
    return new Promise((resolve) => {
      batch.resolve = resolve;
      this._launchAdmissible(batch);
    });
  }

  static _createBatch(tasks, opts) {
    return {
      limit: Math.max(1, Math.floor(opts.concurrency || 1)),
      runTask: opts.runTask,
      signal: opts.signal,
      results: new Array(tasks.length),
      waiting: tasks.map((task, index) => ({ task, index })),
      lockedFiles: new Set(),
      running: 0,
      resolve: null,
    };
  }

  _launchAdmissible(batch) {
    for (let k = 0; k < batch.waiting.length && batch.running < batch.limit;) {
      const { task, index } = batch.waiting[k];
      if (BatchScheduler._isBlocked(task, batch.lockedFiles)) { k++; continue; }
      batch.waiting.splice(k, 1);
      this._start(batch, task, index);
    }
    if (batch.waiting.length === 0 && batch.running === 0) batch.resolve(batch.results);
  }

  static _isBlocked(task, lockedFiles) {
    return BatchScheduler._editFiles(task).some((file) => lockedFiles.has(file));
  }

  static _editFiles(task) {
    return task.kind === 'edit' && Array.isArray(task.files) ? task.files : [];
  }

  _start(batch, task, index) {
    const files = BatchScheduler._editFiles(task);
    batch.running++;
    files.forEach((file) => batch.lockedFiles.add(file));
    BatchScheduler._runOne(batch, task)
      .then((outcome) => { batch.results[index] = { id: task.id, ...outcome }; })
      .then(() => {
        files.forEach((file) => batch.lockedFiles.delete(file));
        batch.running--;
        this._launchAdmissible(batch);
      });
  }

  static _runOne(batch, task) {
    return Promise.resolve()
      .then(() => {
        if (batch.signal && batch.signal.aborted) throw new Error('aborted');
        return batch.runTask(task);
      })
      .then(
        (value) => ({ status: 'done', value }),
        (err) => ({ status: 'error', error: (err && err.message) || String(err) }),
      );
  }
}

module.exports = BatchScheduler;
