import PanelSizeStore from './PanelSizeStore.js';

export default class PanelResizer {
  static PANELS = {
    'right-panel': {
      axis: 'col', cssVar: '--right-panel-width', targetSelector: '#rightPanel', min: 240,
      maxFn: () => Math.round(window.innerWidth * 0.75), storeKey: 'rightPanelWidth',
    },
    'bottom-bar': {
      axis: 'row', cssVar: '--bottom-bar-height', targetSelector: '#extensionBottomBar', min: 56,
      maxFn: () => Math.round(window.innerHeight * 0.8), storeKey: 'bottomBarHeight',
    },
    'ai-activity': {
      axis: 'row', cssVar: '--ai-activity-height', targetSelector: '#aiActivityPanel', min: 120,
      maxFn: () => Math.round(window.innerHeight * 0.85), storeKey: 'aiActivityHeight',
    },
    'ai-chat': {
      axis: 'row', cssVar: '--ai-chat-height', targetSelector: '#aiChatPanel', min: 180,
      maxFn: () => Math.round(window.innerHeight * 0.85), storeKey: 'aiChatHeight',
    },
  };

  install() {
    PanelSizeStore.applyStored(PanelResizer.PANELS);
    document.addEventListener('mousedown', (e) => this._onMouseDown(e));
  }

  static nextSize(cfg, startSize, delta) {
    return Math.max(cfg.min, Math.min(cfg.maxFn(), startSize - delta));
  }

  _onMouseDown(e) {
    const handle = e.target.closest && e.target.closest('[data-resize]');
    if (!handle) return;
    const cfg = PanelResizer.PANELS[handle.dataset.resize];
    if (!cfg) return;
    this._startDrag(e, cfg, handle);
  }

  _startDrag(downEvent, cfg, handleEl) {
    downEvent.preventDefault();
    this._beginDragStyles(cfg, handleEl);
    const startX = downEvent.clientX;
    const startY = downEvent.clientY;
    const startSize = PanelResizer._currentSize(cfg);
    const onMove = (e) => {
      const delta = cfg.axis === 'col' ? (e.clientX - startX) : (e.clientY - startY);
      document.documentElement.style.setProperty(cfg.cssVar, `${PanelResizer.nextSize(cfg, startSize, delta)}px`);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this._endDrag(cfg, handleEl);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  _beginDragStyles(cfg, handleEl) {
    handleEl.classList.add('is-dragging');
    document.body.classList.add('pcd-resizing');
    document.body.style.cursor = cfg.axis === 'col' ? 'col-resize' : 'row-resize';
  }

  _endDrag(cfg, handleEl) {
    handleEl.classList.remove('is-dragging');
    document.body.classList.remove('pcd-resizing');
    document.body.style.cursor = '';
    const v = parseInt(getComputedStyle(document.documentElement).getPropertyValue(cfg.cssVar), 10);
    if (v > 0) PanelSizeStore.remember(cfg.storeKey, v);
  }

  static _currentSize(cfg) {
    const target = document.querySelector(cfg.targetSelector);
    const rect = target ? target.getBoundingClientRect() : null;
    return cfg.axis === 'col' ? (rect?.width || 0) : (rect?.height || 0);
  }
}
