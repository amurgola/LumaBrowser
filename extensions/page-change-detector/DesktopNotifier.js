class DesktopNotifier {
  static TITLE = 'Page Monitors';

  show(headline, detail) {
    const { Notification } = require('electron');
    new Notification({ title: DesktopNotifier.TITLE, body: headline, subtitle: detail }).show();
  }
}

module.exports = DesktopNotifier;
