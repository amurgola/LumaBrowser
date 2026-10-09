const WebhookTester = require('../../core/shell/settings/WebhookTester');

class NotificationIpcHandlers {
  static register(ipc, service, tester = new WebhookTester()) {
    ipc.handle('saveWebhookUrl', async (_event, url) => {
      service.setWebhookUrl(url);
      return { success: true };
    });
    ipc.handle('getWebhookUrl', async () => service.getWebhookUrl());
    ipc.handle('ingest', async (_event, notification) => service.ingest(notification));
    ipc.handle('getLog', async () => service.getLog());
    ipc.handle('clearLog', async () => {
      service.clearLog();
      return { success: true };
    });
    ipc.handle('forwardNotification', async (_event, notification) => service.forward(notification));
    ipc.handle('testWebhook', async (_event, url) => tester.test(url));
  }
}

module.exports = NotificationIpcHandlers;
