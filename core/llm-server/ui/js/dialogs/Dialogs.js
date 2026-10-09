export default class Dialogs {
  static alert(message, opts) {
    const modal = Dialogs._modal('alert');
    if (modal) return modal.alert(message, opts);
    return Promise.resolve(window.alert(message));
  }

  static confirm(message, opts) {
    const modal = Dialogs._modal('confirm');
    if (modal) return modal.confirm(message, opts);
    return Promise.resolve(!!window.confirm(message));
  }

  static prompt(message, defaultValue, opts) {
    const modal = Dialogs._modal('prompt');
    if (modal) return modal.prompt(message, defaultValue, opts);
    return Promise.resolve(window.prompt(message, defaultValue));
  }

  static _modal(method) {
    const modal = window.LumaModal;
    return modal && typeof modal[method] === 'function' ? modal : null;
  }
}
