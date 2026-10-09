export default class ShellGlobals {
  static publish(a) {
    Object.assign(window, {
      createNewTab: (url, options) => a.tabActions.create(url, options),
      closeTab: (tabId) => a.tabActions.close(tabId),
      addLogEntry: (message, type) => a.log.add(message, type),
      hideNotificationLog: () => a.log.hide(),
      updateWebhookStatus: (url) => a.webhook.updateStatus(url),
      handleNotification: (data, tabId) => a.webhook.handle(data, tabId),
      registerTabMenuContributor: (fn) => a.contributors.register(fn),
      openSettings: (tab) => a.settings.open(tab),
      closeSettings: () => a.settings.close(),
      gsMarkSaved: (control, ok, errorMessage) => a.feedback.markSaved(control, ok, errorMessage),
      settingsToast: (message, kind, opts) => a.feedback.toast(message, kind, opts),
      __rerunSetupWizard: () => a.wizard.maybeShow({ force: true }),
      __loadExtensionRenderers: () => a.extensionLoader.load(),
    });
    if (a.browserRenderer) window.browserRenderer = a.browserRenderer;
    if (a.slotManager) window.uiSlotManager = a.slotManager;
  }
}
