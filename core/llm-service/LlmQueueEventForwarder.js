class LlmQueueEventForwarder {
  static EVENTS = ['task-queued', 'task-processing', 'task-completed', 'queue-stats', 'queue-registered'];

  static attach(queueManager, getMainWindow) {
    if (!queueManager) return;
    for (const eventName of LlmQueueEventForwarder.EVENTS) {
      queueManager.on(eventName, (data) => LlmQueueEventForwarder._send(getMainWindow, eventName, data));
    }
  }

  static _send(getMainWindow, eventName, data) {
    const win = typeof getMainWindow === 'function' ? getMainWindow() : null;
    if (win && !win.isDestroyed()) win.webContents.send(`core.llm.queue.${eventName}`, data);
  }
}

module.exports = LlmQueueEventForwarder;
