const TriggerGatingParams = require('./TriggerGatingParams');

class TriggerCreateSource {
  static KINDS = ['file', 'page', 'notification'];

  static kindOf(params) {
    return TriggerCreateSource.KINDS.includes(params.kind) ? params.kind : 'webhook';
  }

  static build(kind, params, services) {
    const base = TriggerCreateSource._kindSource(kind, params, services);
    if (base.error) return base;
    const source = { ...base.source, ...TriggerGatingParams.toSource(params) };
    if (source.batch && source.batch.keepWindow) delete source.batch;
    if (source.memory && source.memory.runsOnly) delete source.memory;
    return TriggerCreateSource._validated(kind, params, source);
  }

  static _kindSource(kind, params, services) {
    if (kind === 'notification') return TriggerCreateSource._notification(params, services);
    if (kind === 'file') return TriggerCreateSource._file(params, services);
    if (kind === 'page') return TriggerCreateSource._page(params, services);
    return { source: { respond: params.respond, preset: params.preset, authHeader: params.auth_header } };
  }

  static _notification(params, services) {
    if (!params.host && !params.tab_partition) {
      return { error: 'a notification trigger needs `host` (the site) and/or `tab_partition` (a persisted tab from <persisted_tabs>)' };
    }
    const source = { host: params.host };
    if (!params.tab_partition) return { source };
    const notifications = services.notificationSource();
    const tab = notifications && typeof notifications.getTab === 'function' ? notifications.getTab(String(params.tab_partition)) : null;
    if (!tab) return { error: `no persisted tab with partition ${params.tab_partition} (see <persisted_tabs>)` };
    return { source: { ...source, tabPartition: tab.partition, tabTitle: tab.title, tabUrl: tab.url } };
  }

  static _file(params, services) {
    if (!params.dir) return { error: 'a file trigger needs `dir`, the absolute folder to watch; ask the user for it' };
    try {
      const dir = services.validateDir(String(params.dir));
      return { source: { dir, glob: params.glob, events: params.file_events, recursive: params.recursive, allowWrite: params.allow_write } };
    } catch (err) {
      return { error: err.message };
    }
  }

  static _page(params, services) {
    if (!params.monitor_id) return { error: 'a page trigger needs `monitor_id` (see <page_monitors>)' };
    const pageSource = services.pageSource();
    const monitor = pageSource ? pageSource.getMonitor(String(params.monitor_id)) : null;
    if (!monitor) return { error: `no Page Watcher monitor with id ${params.monitor_id}` };
    return { source: { monitorId: monitor.id, url: monitor.url, name: monitor.name } };
  }

  static _validated(kind, params, source) {
    const quietError = TriggerGatingParams.quietHoursError(source);
    if (quietError) return { error: quietError };
    if (source.batch && kind === 'webhook' && params.respond === 'result') {
      return { error: 'a batch window cannot be combined with respond=result (the sender cannot wait for the window); use ack' };
    }
    return { source };
  }
}

module.exports = TriggerCreateSource;
