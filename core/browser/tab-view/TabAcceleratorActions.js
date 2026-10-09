class TabAcceleratorActions {
  static ZOOM_STEP = 0.1;

  constructor(tabs) {
    this._tabs = tabs;
  }

  perform(entry, action) {
    const run = this._actions()[action];
    if (run) run(entry.id);
  }

  _actions() {
    const tabs = this._tabs;
    return {
      reload: (id) => tabs.reload(id),
      'hard-reload': (id) => tabs.reload(id, { ignoreCache: true }),
      back: (id) => tabs.goBack(id),
      forward: (id) => tabs.goForward(id),
      stop: (id) => tabs.stop(id),
      'zoom-in': (id) => tabs.zoomBy(id, TabAcceleratorActions.ZOOM_STEP),
      'zoom-out': (id) => tabs.zoomBy(id, -TabAcceleratorActions.ZOOM_STEP),
      'zoom-reset': (id) => tabs.setZoom(id, 1),
      devtools: (id) => tabs.toggleDevTools(id),
      print: (id) => tabs.print(id),
    };
  }
}

module.exports = TabAcceleratorActions;
