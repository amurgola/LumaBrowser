const IpcEnvelope = require('../../core/shared/ipc/IpcEnvelope');

class HubIpcHandlers {
  static PANEL_CHANNELS = [
    'listContexts', 'saveContexts', 'listContextChoices',
    'summaryStatus', 'setSummariesEnabled', 'summarizeNow', 'listSummaryModels', 'setSummaryModel',
    'listContacts', 'mergeContacts', 'splitContactIdentity', 'renameContact', 'keepContactsApart',
  ];

  static register(ipc, api, { openUrl = async () => ({ success: false }) } = {}) {
    const table = {};
    const on = (channel, fn) => {
      table[channel] = IpcEnvelope.enveloped(fn);
      ipc.handle(channel, table[channel]);
    };
    HubIpcHandlers._registerCalendars(on, api, openUrl);
    HubIpcHandlers._registerBoard(on, api);
    HubIpcHandlers._registerSync(on, api);
    HubIpcHandlers._registerConnections(on, api);
    HubIpcHandlers._registerDistilled(on, api);
    return table;
  }

  static async invoke(table, channel, args) {
    if (!HubIpcHandlers.PANEL_CHANNELS.includes(channel) || typeof table[channel] !== 'function') {
      return { success: false, error: `"${channel}" is not available from the Dashboard.` };
    }
    return table[channel](null, ...(Array.isArray(args) ? args : []));
  }

  static _registerDistilled(on, api) {
    on('listSummaryModels', () => api.summaryModels());
    on('setSummaryModel', (_e, value) => ({ status: api.setSummaryModel(value || '') }));
    on('listContexts', () => ({ contexts: api.listContexts() }));
    on('saveContexts', (_e, contexts) => ({ contexts: api.saveContexts(contexts || []) }));
    on('listContextChoices', () => HubIpcHandlers._contextChoices(api));
    on('listContacts', (_e, query) => api.listContacts(query || {}));
    on('mergeContacts', (_e, intoId, fromId) => ({ contact: api.mergeContacts(intoId, fromId) }));
    on('splitContactIdentity', (_e, identityId) => ({ contact: api.splitContactIdentity(identityId) }));
    on('renameContact', (_e, id, name) => ({ contact: api.renameContact(id, name) }));
    on('keepContactsApart', (_e, aId, bId) => ({ kept: api.keepContactsApart(aId, bId) }));
    on('summaryStatus', () => ({ status: api.summaryStatus() }));
    on('setSummariesEnabled', (_e, enabled) => ({ status: api.setSummariesEnabled(!!enabled) }));
    on('summarizeNow', async (_e, opts) => ({ result: await api.summarizeNow(opts || {}), status: api.summaryStatus() }));
  }

  static _contextChoices(api) {
    const seen = new Set();
    const tabs = [];
    for (const row of (api.listConnections() || {}).connections || []) {
      if (row.kind !== 'tab' || !row.partition || seen.has(row.partition)) continue;
      seen.add(row.partition);
      tabs.push({ value: row.partition, label: row.name || row.title || row.appLabel || row.partition });
    }
    const named = (sources) => (sources || []).map((s) => ({ value: s.id, label: s.label || s.id }));
    return { tabs, calendars: named(api.listCalendarSources()), trackers: named(api.listTaskSources()) };
  }

  static _registerConnections(on, api) {
    on('listConnections', () => api.listConnections());
    on('checkConnections', async () => api.checkConnections());
    on('showConnectionTab', (_e, key) => {
      const shown = api.showConnectionTab(key);
      if (shown && shown.success === false) throw new Error(shown.error || 'Could not open the tab');
      return {};
    });
    on('openSignInTab', async (_e, provider) => {
      const opened = await api.openSignInTab(provider);
      if (opened && opened.success === false) throw new Error(opened.error || 'Could not open the tab');
      return { tabId: opened.tabId, partition: opened.partition };
    });
    on('listAccountCalendars', async () => ({ accounts: await api.listAccountCalendars() }));
    on('setAccountCalendar', async (_e, input) => ({ accounts: await api.setAccountCalendar(input || {}) }));
  }

  static _registerCalendars(on, api, openUrl) {
    on('listCalendarSources', () => ({ sources: api.listCalendarSources() }));
    on('addCalendarSource', (_e, input) => ({ source: api.addCalendarSource(input || {}) }));
    on('updateCalendarSource', (_e, id, patch) => ({ source: api.updateCalendarSource(id, patch || {}) }));
    on('removeCalendarSource', (_e, id) => ({ removed: api.removeCalendarSource(id) }));
    on('startOAuth', async (_e, sourceId) => {
      const started = await api.startOAuth(sourceId);
      if (!started || started.success === false) throw new Error((started && started.error) || 'Could not start sign-in');
      await openUrl(started.url);
      return { url: started.url };
    });
  }

  static _registerBoard(on, api) {
    on('listTaskSources', () => ({ sources: api.listTaskSources() }));
    on('addTaskSource', (_e, input) => ({ source: api.addTaskSource(input || {}) }));
    on('updateTaskSource', (_e, id, patch) => ({ source: api.updateTaskSource(id, patch || {}) }));
    on('removeTaskSource', (_e, id) => ({ removed: api.removeTaskSource(id) }));
    on('discoverTaskSource', async (_e, input) => api.discoverTaskSource(input || {}));
    on('listColumns', () => ({ columns: api.listColumns() }));
    on('saveColumns', (_e, columns) => ({ columns: api.saveColumns(columns || []) }));
    on('resetStatusLinks', (_e, sourceId) => ({ source: api.resetStatusLinks(sourceId) }));
  }

  static _registerSync(on, api) {
    on('syncNow', async (_e, opts) => {
      const result = await api.syncNow(opts || {});
      if (result && result.success === false) throw new Error(result.error);
      return { results: result.results };
    });
    on('syncStatus', () => ({ status: api.syncStatus() }));
    on('getInboundInfo', () => api.inboundInfo());
    on('rotateInboundToken', () => ({ token: api.rotateInboundToken() }));
  }
}

module.exports = HubIpcHandlers;
