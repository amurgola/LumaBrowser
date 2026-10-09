import NotificationCapture from './NotificationCapture.js';
import NotificationSettingsTab from './NotificationSettingsTab.js';

export default class NotificationInterceptorRenderer {
  constructor() {
    this._active = false;
    this._tab = new NotificationSettingsTab();
    this._capture = new NotificationCapture(this._tab);
  }

  async activate(context) {
    if (this._active) this.deactivate();
    this._active = true;
    await this._tab.activate(context);
    this._capture.install(context.browserRenderer);
  }

  deactivate() {
    this._capture.uninstall();
    this._tab.deactivate();
    this._active = false;
  }
}
