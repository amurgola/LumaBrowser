const ActivityLogIpcHandlers = require('./ActivityLogIpcHandlers');

class ActivityLogExtension {
  constructor() {
    this._service = null;
  }

  async activate(context) {
    const service = context.sharedServices && context.sharedServices.activityLog;
    if (!service) throw new Error('activity-log: core activityLog service not available, cannot activate');
    this._service = service;
    ActivityLogIpcHandlers.register(context.ipc, service);
    return { getService: () => this._service };
  }

  async deactivate() {
    this._service = null;
  }
}

module.exports = ActivityLogExtension;
