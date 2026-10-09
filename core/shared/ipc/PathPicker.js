const { dialog, BrowserWindow } = require('electron');

class PathPicker {
  static async pick(event, dialogOptions, { useFocusedWindow = false } = {}) {
    const parent = PathPicker._resolveParentWindow(event, useFocusedWindow);
    const result = await PathPicker._showDialog(parent, dialogOptions);
    return PathPicker._normaliseResult(result);
  }

  static _resolveParentWindow(event, useFocusedWindow) {
    try {
      const senderWindow = event && event.sender && BrowserWindow.fromWebContents(event.sender);
      if (senderWindow) return senderWindow;
      return useFocusedWindow ? (BrowserWindow.getFocusedWindow() || null) : null;
    } catch (_) {
      return null;
    }
  }

  static _showDialog(parent, dialogOptions) {
    return parent ? dialog.showOpenDialog(parent, dialogOptions) : dialog.showOpenDialog(dialogOptions);
  }

  static _normaliseResult(result) {
    if (!result || result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }
    return { canceled: false, paths: result.filePaths };
  }
}

module.exports = PathPicker;
