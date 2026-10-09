const { contextBridge, ipcRenderer } = require('electron');

const __BOOT_START = (global.__LUMA_BOOT_START || Date.now());
console.log(`[luma-boot +${Date.now() - __BOOT_START}ms] preload: script loading`);

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    saveWebhookUrl: (url) => ipcRenderer.invoke('ext.notification-interceptor.saveWebhookUrl', url),
    getWebhookUrl: () => ipcRenderer.invoke('ext.notification-interceptor.getWebhookUrl'),
    forwardNotification: (data) => ipcRenderer.invoke('ext.notification-interceptor.forwardNotification', data),
    testWebhook: (url) => ipcRenderer.invoke('ext.notification-interceptor.testWebhook', url),
    onSettingsLoaded: (callback) => ipcRenderer.on('settings-loaded', callback),
    saveLlmProviderConfig: (config) => ipcRenderer.invoke('save-llm-provider-config', config),
    getLlmProviderConfig: () => ipcRenderer.invoke('get-llm-provider-config'),
    saveLmStudioConfig: (config) => ipcRenderer.invoke('save-lmstudio-config', config),
    getLmStudioConfig: () => ipcRenderer.invoke('get-lmstudio-config'),
    fetchLmStudioModels: (endpoint) => ipcRenderer.invoke('fetch-lmstudio-models', endpoint),
    testLmStudioConnection: () => ipcRenderer.invoke('test-lmstudio-connection'),
    saveAnthropicConfig: (config) => ipcRenderer.invoke('save-anthropic-config', config),
    getAnthropicConfig: () => ipcRenderer.invoke('get-anthropic-config'),
    fetchAnthropicModels: (endpoint) => ipcRenderer.invoke('fetch-anthropic-models', endpoint),
    testAnthropicConnection: () => ipcRenderer.invoke('test-anthropic-connection'),
    openDashboard: () => ipcRenderer.invoke('core.dashboard.open'),
    getLicenses: () => ipcRenderer.invoke('core.shell.getLicenses'),
    openExternal: (url) => ipcRenderer.invoke('core.shell.openExternal', url),
    getTelemetryStatus: () => ipcRenderer.invoke('core.telemetry.getStatus'),
    setTelemetryOptOut: (optOut) => ipcRenderer.invoke('core.telemetry.setOptOut', optOut),
    getApiPort: () => ipcRenderer.invoke('core.settings.getApiPort'),
    getEffectiveApiPort: () => ipcRenderer.invoke('core.settings.getEffectiveApiPort'),
    setApiPort: (port) => ipcRenderer.invoke('core.settings.setApiPort', port),
    getApiEnabled: () => ipcRenderer.invoke('core.settings.getApiEnabled'),
    setApiEnabled: (enabled) => ipcRenderer.invoke('core.settings.setApiEnabled', enabled),
    getMcpEnabled: () => ipcRenderer.invoke('core.settings.getMcpEnabled'),
    setMcpEnabled: (enabled) => ipcRenderer.invoke('core.settings.setMcpEnabled', enabled),
    getRunOnStartup: () => ipcRenderer.invoke('core.settings.getRunOnStartup'),
    setRunOnStartup: (enabled) => ipcRenderer.invoke('core.settings.setRunOnStartup', enabled),
    getDnsProvider: () => ipcRenderer.invoke('core.settings.getDnsProvider'),
    setDnsProvider: (provider) => ipcRenderer.invoke('core.settings.setDnsProvider', provider),
    getAutoCheckUpdates: () => ipcRenderer.invoke('core.settings.getAutoCheckUpdates'),
    setAutoCheckUpdates: (enabled) => ipcRenderer.invoke('core.settings.setAutoCheckUpdates', enabled),
    checkForUpdates: () => ipcRenderer.invoke('core.app.checkForUpdates'),
    onUpdateStatus: (cb) => ipcRenderer.on('core.app.update-status', (_e, payload) => cb(payload)),
    exportMcpConfig: () => ipcRenderer.invoke('core.settings.exportMcpConfig'),
    harnessList: () => ipcRenderer.invoke('core.settings.harness.list'),
    harnessConnect: (id) => ipcRenderer.invoke('core.settings.harness.connect', id),
    harnessDisconnect: (id) => ipcRenderer.invoke('core.settings.harness.disconnect', id),
    harnessWriteSkills: () => ipcRenderer.invoke('core.settings.harness.writeSkills'),
    getSetupComplete: () => ipcRenderer.invoke('core.settings.getSetupComplete'),
    getPersona: () => ipcRenderer.invoke('core.settings.getPersona'),
    setPersona: (persona) => ipcRenderer.invoke('core.settings.setPersona', persona),
    setSetupComplete: (payload) => ipcRenderer.invoke('core.settings.setSetupComplete', payload),
    resetSetupComplete: () => ipcRenderer.invoke('core.settings.resetSetupComplete'),
    setDisabledExtensions: (ids) => ipcRenderer.invoke('core.settings.setDisabledExtensions', ids),
    setWebhookUrlDirect: (url) => ipcRenderer.invoke('core.settings.setWebhookUrl', url),
    testWebhookDirect: (url) => ipcRenderer.invoke('core.settings.testWebhook', url),
    getGuide: (type) => ipcRenderer.invoke('core.settings.getGuide', type),
    getAvailableEndpoints: () => ipcRenderer.invoke('core.settings.getAvailableEndpoints'),
    setEndpointConfig: (config) => ipcRenderer.invoke('core.settings.setEndpointConfig', config),
    apiSecurity: {
      get: () => ipcRenderer.invoke('core.settings.apiSecurity.get'),
      setNetworkMode: (mode) => ipcRenderer.invoke('core.settings.apiSecurity.setNetworkMode', mode),
      setWhitelist: (list) => ipcRenderer.invoke('core.settings.apiSecurity.setWhitelist', list),
      setRequireApiKey: (enabled) => ipcRenderer.invoke('core.settings.apiSecurity.setRequireApiKey', enabled),
      createKey: (label) => ipcRenderer.invoke('core.settings.apiSecurity.createKey', label),
      updateKeyLabel: (id, label) => ipcRenderer.invoke('core.settings.apiSecurity.updateKeyLabel', id, label),
      refreshKey: (id) => ipcRenderer.invoke('core.settings.apiSecurity.refreshKey', id),
      deleteKey: (id) => ipcRenderer.invoke('core.settings.apiSecurity.deleteKey', id),
    },
    sitePermissions: {
      list: () => ipcRenderer.invoke('core.settings.sitePermissions.list'),
      clear: (origin) => ipcRenderer.invoke('core.settings.sitePermissions.clear', origin),
      clearAll: () => ipcRenderer.invoke('core.settings.sitePermissions.clearAll'),
    },
  });

  contextBridge.exposeInMainWorld('permissionPromptAPI', {
    onPrompt: (cb) => {
      const listener = (_e, p) => cb(p);
      ipcRenderer.on('permission:prompt', listener);
      return () => ipcRenderer.removeListener('permission:prompt', listener);
    },
    onClose: (cb) => {
      const listener = (_e, p) => cb(p);
      ipcRenderer.on('permission:prompt-close', listener);
      return () => ipcRenderer.removeListener('permission:prompt-close', listener);
    },
    respond: (requestId, decision) => ipcRenderer.send('permission:decision', { requestId, decision }),
  });

  contextBridge.exposeInMainWorld('llmSlotAPI', {
    getAllSlots: () => ipcRenderer.invoke('core.llm.getAllSlots'),
    getSlotConfig: (slotId) => ipcRenderer.invoke('core.llm.getSlotConfig', slotId),
    setSlotConfig: (slotId, provider, model) => ipcRenderer.invoke('core.llm.setSlotConfig', slotId, provider, model),
    clearSlotConfig: (slotId) => ipcRenderer.invoke('core.llm.clearSlotConfig', slotId),
    getAllAvailableModels: () => ipcRenderer.invoke('core.llm.getAllAvailableModels'),
    getProviders: () => ipcRenderer.invoke('core.llm.getProviders'),
    sendCompletion: (slotId, messages, options) => ipcRenderer.invoke('core.llm.sendCompletion', slotId, messages, options),
  });

  contextBridge.exposeInMainWorld('llmQueueAPI', {
    getSnapshot: () => ipcRenderer.invoke('core.llm.queue.getSnapshot'),
    setConcurrency: (modelId, max) => ipcRenderer.invoke('core.llm.queue.setConcurrency', modelId, max),
    onTaskQueued: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llm.queue.task-queued', listener);
      return () => ipcRenderer.removeListener('core.llm.queue.task-queued', listener);
    },
    onTaskProcessing: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llm.queue.task-processing', listener);
      return () => ipcRenderer.removeListener('core.llm.queue.task-processing', listener);
    },
    onTaskCompleted: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llm.queue.task-completed', listener);
      return () => ipcRenderer.removeListener('core.llm.queue.task-completed', listener);
    },
    onQueueStats: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llm.queue.queue-stats', listener);
      return () => ipcRenderer.removeListener('core.llm.queue.queue-stats', listener);
    },
    onSchedTaskEvent: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llmServer.schedTasks.event', listener);
      return () => ipcRenderer.removeListener('core.llmServer.schedTasks.event', listener);
    },
    onQueueRegistered: (cb) => {
      const listener = (_e, data) => cb(data);
      ipcRenderer.on('core.llm.queue.queue-registered', listener);
      return () => ipcRenderer.removeListener('core.llm.queue.queue-registered', listener);
    },
  });

  contextBridge.exposeInMainWorld('tabAPI', {
    create: (url, options) => ipcRenderer.invoke('tab-view:create', url, options),
    close: (tabId) => ipcRenderer.invoke('tab-view:close', tabId),
    switch: (tabId) => ipcRenderer.invoke('tab-view:switch', tabId),
    navigate: (tabId, url) => ipcRenderer.invoke('tab-view:navigate', tabId, url),
    reload: (tabId) => ipcRenderer.invoke('tab-view:reload', tabId),
    goBack: (tabId) => ipcRenderer.invoke('tab-view:go-back', tabId),
    goForward: (tabId) => ipcRenderer.invoke('tab-view:go-forward', tabId),
    getHistory: (tabId) => ipcRenderer.invoke('tab-view:get-history', tabId),
    goToIndex: (tabId, index) => ipcRenderer.invoke('tab-view:go-to-index', tabId, index),
    setZoom: (tabId, zoomLevel) => ipcRenderer.invoke('tab-view:set-zoom', tabId, zoomLevel),
    getZoom: (tabId) => ipcRenderer.invoke('tab-view:get-zoom', tabId),
    getAll: () => ipcRenderer.invoke('tab-view:get-all'),
    getOrder: () => ipcRenderer.invoke('tab-view:get-order'),
    clearCache: () => ipcRenderer.invoke('tab-view:clear-cache'),
    setPersist: (tabId, persist) => ipcRenderer.invoke('tab-view:set-persist', tabId, persist),
    show: (tabId) => ipcRenderer.invoke('tab-view:show', tabId),
    getPersisted: () => ipcRenderer.invoke('tab-view:get-persisted'),
    setBounds: (bounds) => ipcRenderer.send('tab-view:set-bounds', bounds),
    stop: (tabId) => ipcRenderer.invoke('tab-view:stop', tabId),
    hardReload: (tabId) => ipcRenderer.invoke('tab-view:hard-reload', tabId),
    moveTab: (tabId, toIndex) => ipcRenderer.invoke('tab-view:move', tabId, toIndex),
    cycle: (delta) => ipcRenderer.invoke('tab-view:cycle', delta),
    selectIndex: (n) => ipcRenderer.invoke('tab-view:select-index', n),
    reopenClosed: () => ipcRenderer.invoke('tab-view:reopen-closed'),
    print: (tabId) => ipcRenderer.invoke('tab-view:print', tabId),
    toggleDevTools: (tabId) => ipcRenderer.invoke('tab-view:toggle-devtools', tabId),
    findInPage: (tabId, text, opts) => ipcRenderer.invoke('tab-view:find', tabId, text, opts || {}),
    stopFindInPage: (tabId, action) => ipcRenderer.invoke('tab-view:stop-find', tabId, action),
    onFoundInPage: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab-view:found-in-page', listener);
      return () => ipcRenderer.removeListener('tab-view:found-in-page', listener);
    },
    onAccelerator: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab-view:accelerator', listener);
      return () => ipcRenderer.removeListener('tab-view:accelerator', listener);
    },
    onDownload: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab-view:download', listener);
      return () => ipcRenderer.removeListener('tab-view:download', listener);
    },
    listDownloads: () => ipcRenderer.invoke('tab-view:download-list'),
    openDownload: (id) => ipcRenderer.invoke('tab-view:download-open', id),
    showDownloadInFolder: (id) => ipcRenderer.invoke('tab-view:download-show', id),
    cancelDownload: (id) => ipcRenderer.invoke('tab-view:download-cancel', id),
    clearDownloads: () => ipcRenderer.invoke('tab-view:download-clear'),
    onMoved: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab:moved', listener);
      return () => ipcRenderer.removeListener('tab:moved', listener);
    },
    onState: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab:state', listener);
      return () => ipcRenderer.removeListener('tab:state', listener);
    },
    onClosed: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab:closed', listener);
      return () => ipcRenderer.removeListener('tab:closed', listener);
    },
    onHidden: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab:hidden', listener);
      return () => ipcRenderer.removeListener('tab:hidden', listener);
    },
    onSwitched: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab:switched', listener);
      return () => ipcRenderer.removeListener('tab:switched', listener);
    },
    onNotificationIntercepted: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('notification-intercepted', listener);
      return () => ipcRenderer.removeListener('notification-intercepted', listener);
    },
  });

  contextBridge.exposeInMainWorld('historyAPI', {
    suggest: (query, opts) => ipcRenderer.invoke('history:suggest', query, opts),
    list: (opts) => ipcRenderer.invoke('history:list', opts),
    delete: (id) => ipcRenderer.invoke('history:delete', id),
    deleteUrl: (url) => ipcRenderer.invoke('history:delete-url', url),
    clear: (opts) => ipcRenderer.invoke('history:clear', opts),
  });

  contextBridge.exposeInMainWorld('bookmarksAPI', {
    getTree: () => ipcRenderer.invoke('bookmarks:get-tree'),
    add: (payload) => ipcRenderer.invoke('bookmarks:add', payload),
    addFolder: (payload) => ipcRenderer.invoke('bookmarks:add-folder', payload),
    update: (id, patch) => ipcRenderer.invoke('bookmarks:update', id, patch),
    move: (id, parentId, position) => ipcRenderer.invoke('bookmarks:move', id, parentId, position),
    remove: (id) => ipcRenderer.invoke('bookmarks:remove', id),
    isBookmarked: (url) => ipcRenderer.invoke('bookmarks:is-bookmarked', url),
    toggleUrl: (url, title) => ipcRenderer.invoke('bookmarks:toggle-url', url, title),
    onChanged: (cb) => {
      const listener = () => cb();
      ipcRenderer.on('bookmarks:changed', listener);
      return () => ipcRenderer.removeListener('bookmarks:changed', listener);
    },
  });

  contextBridge.exposeInMainWorld('viewDebugAPI', {
    dump: () => ipcRenderer.invoke('debug:view-stack'),
    trace: (opts) => ipcRenderer.invoke('debug:runtime-trace', opts || {}),
  });

  contextBridge.exposeInMainWorld('chromeOverlayAPI', {
    show: (payload) => ipcRenderer.send('chrome-overlay:show', payload),
    setActive: (activeIndex, id) => ipcRenderer.send('chrome-overlay:set-active', { id: id || 'popup', activeIndex }),
    hide: (id) => ipcRenderer.send('chrome-overlay:hide', { id: id || 'popup' }),
    onAction: (cb) => {
      const listener = (_e, p) => cb(p);
      ipcRenderer.on('chrome-overlay:action', listener);
      return () => ipcRenderer.removeListener('chrome-overlay:action', listener);
    },
    onHover: (cb) => {
      const listener = (_e, p) => cb(p);
      ipcRenderer.on('chrome-overlay:hover', listener);
      return () => ipcRenderer.removeListener('chrome-overlay:hover', listener);
    },
  });

  contextBridge.exposeInMainWorld('browserSettingsAPI', {
    getStartPage: () => ipcRenderer.invoke('settings:get-start-page'),
    setStartPage: (url) => ipcRenderer.invoke('settings:set-start-page', url),
    getDarkMode: () => ipcRenderer.invoke('settings:get-dark-mode'),
    setDarkMode: (enabled) => ipcRenderer.invoke('settings:set-dark-mode', enabled),
    getSearchEngine: () => ipcRenderer.invoke('settings:get-search-engine'),
    setSearchEngine: (id) => ipcRenderer.invoke('settings:set-search-engine', id),
    listSearchEngines: () => ipcRenderer.invoke('settings:list-search-engines'),
    searchUrl: (query) => ipcRenderer.invoke('settings:search-url', query),
  });

  contextBridge.exposeInMainWorld('browserDataAPI', {
    getFavicon: (host) => ipcRenderer.invoke('browser-data:get-favicon', host),
    getFavicons: (hosts) => ipcRenderer.invoke('browser-data:get-favicons', hosts),
    onFavicon: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('tab-view:favicon', listener);
      return () => ipcRenderer.removeListener('tab-view:favicon', listener);
    },
  });

  contextBridge.exposeInMainWorld('localApiAPI', {
    getConfig: () => ipcRenderer.invoke('core.llmServer.localApi.getConfig'),
    setEnabled: (enabled) => ipcRenderer.invoke('core.llmServer.localApi.setEnabled', enabled),
    setPort: (port) => ipcRenderer.invoke('core.llmServer.localApi.setPort', port),
  });

  contextBridge.exposeInMainWorld('sharingAPI', {
    getHostConfig: () => ipcRenderer.invoke('core.sharing.host.getConfig'),
    setHostEnabled: (enabled) => ipcRenderer.invoke('core.sharing.host.setEnabled', enabled),
    setPin: (pin) => ipcRenderer.invoke('core.sharing.host.setPin', pin),
    clearPin: () => ipcRenderer.invoke('core.sharing.host.clearPin'),
    setInstanceName: (name) => ipcRenderer.invoke('core.sharing.host.setInstanceName', name),
    setBindMode: (mode) => ipcRenderer.invoke('core.sharing.host.setBindMode', mode),
    setShareFlag: (flag, value) => ipcRenderer.invoke('core.sharing.host.setShareFlag', flag, value),
    setWebEnabled: (enabled) => ipcRenderer.invoke('core.sharing.host.setWebEnabled', enabled),
    setWebPort: (port) => ipcRenderer.invoke('core.sharing.host.setWebPort', port),
    setWebPublicUrl: (url) => ipcRenderer.invoke('core.sharing.host.setWebPublicUrl', url),
    setWebAllowedTools: (tools) => ipcRenderer.invoke('core.sharing.host.setWebAllowedTools', tools),
    firewallStatus: () => ipcRenderer.invoke('core.sharing.host.firewall.getStatus'),
    firewallAllow: () => ipcRenderer.invoke('core.sharing.host.firewall.allow'),
    listTokens: () => ipcRenderer.invoke('core.sharing.host.listTokens'),
    revokeToken: (id) => ipcRenderer.invoke('core.sharing.host.revokeToken', id),
    removeToken: (id) => ipcRenderer.invoke('core.sharing.host.removeToken', id),
    revokeAllTokens: () => ipcRenderer.invoke('core.sharing.host.revokeAllTokens'),
    listPeers: () => ipcRenderer.invoke('core.sharing.client.listPeers'),
    probe: (address, port) => ipcRenderer.invoke('core.sharing.client.probe', address, port),
    pair: (address, pin, port) => ipcRenderer.invoke('core.sharing.client.pair', address, pin, port),
    refreshPeer: (id) => ipcRenderer.invoke('core.sharing.client.refreshPeer', id),
    setPeerEnabled: (id, enabled) => ipcRenderer.invoke('core.sharing.client.setPeerEnabled', id, enabled),
    setPeerGpusAttached: (id, attached) => ipcRenderer.invoke('core.sharing.client.setPeerGpusAttached', id, attached),
    removePeer: (id) => ipcRenderer.invoke('core.sharing.client.removePeer', id),
    getDiscovered: () => ipcRenderer.invoke('core.sharing.client.getDiscovered'),
    startDiscovery: () => ipcRenderer.invoke('core.sharing.client.startDiscovery'),
    stopDiscovery: () => ipcRenderer.invoke('core.sharing.client.stopDiscovery'),
  });

  contextBridge.exposeInMainWorld('imageServersAPI', {
    getServerConfigs: () => ipcRenderer.invoke('core.imageServer.getServerConfigs'),
    saveRemoteServers: (list) => ipcRenderer.invoke('core.imageServer.saveRemoteServers', list),
    removeRemoteServer: (id) => ipcRenderer.invoke('core.imageServer.removeRemoteServer', id),
    setActiveServer: (role, id) => ipcRenderer.invoke('core.imageServer.setActiveServer', role, id),
    setRemoteServerModel: (id, modelId) => ipcRenderer.invoke('core.imageServer.setRemoteServerModel', id, modelId),
  });

  contextBridge.exposeInMainWorld('windowAPI', {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onStateChange: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('window:state', listener);
      return () => ipcRenderer.removeListener('window:state', listener);
    },
  });

  contextBridge.exposeInMainWorld('modelStatusAPI', {
    onStatus: (cb) => {
      const listener = (_e, payload) => cb(payload);
      ipcRenderer.on('model-status', listener);
      return () => ipcRenderer.removeListener('model-status', listener);
    },
  });

  contextBridge.exposeInMainWorld('__LUMA_BOOT_START', __BOOT_START);

  contextBridge.exposeInMainWorld('ipcBridge', {
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    on: (channel, callback) => {
      const listener = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    },
    getExtensions: () => ipcRenderer.invoke('core.shell.getExtensions'),
    getProviderConfigs: () => ipcRenderer.invoke('core.llm.getProviderConfigs'),
    saveProviderConfigs: (configs) => ipcRenderer.invoke('core.llm.saveProviderConfigs', configs),
    fetchModelsForEndpoint: (type, endpoint, apiKey) => ipcRenderer.invoke('core.llm.fetchModelsForEndpoint', type, endpoint, apiKey),
    getExtensionErrors: () => ipcRenderer.invoke('core.shell.getExtensionErrors'),
    openExtensionFileDialog: () => ipcRenderer.invoke('core.shell.openExtensionFileDialog'),
    installExtension: (filePath) => ipcRenderer.invoke('core.shell.installExtension', filePath),
  });

  console.log(`[luma-boot +${Date.now() - __BOOT_START}ms] preload: electronAPI exposed`);
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}
