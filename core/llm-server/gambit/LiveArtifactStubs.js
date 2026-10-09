class LiveArtifactStubs {
  static INJECTED = ['root', 'R', 'store', 'Chart', 'luma'];

  static create() {
    return {
      root: LiveArtifactStubs._element(),
      R: LiveArtifactStubs._resonant(),
      store: { get: async () => null, set: async () => {}, clear: async () => {} },
      Chart: function Chart() { return { update() {}, destroy() {}, data: {}, options: {} }; },
      luma: { fetchPage: async () => ({ ok: false }), openTab: async () => null },
      __ambient: LiveArtifactStubs._ambient(),
    };
  }

  static _element() {
    const el = LiveArtifactStubs._element;
    return {
      style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      dataset: {}, children: [], value: '', textContent: '', innerHTML: '', checked: false,
      addEventListener() {}, removeEventListener() {}, appendChild() {}, removeChild() {},
      setAttribute() {}, getAttribute: () => null, remove() {}, focus() {}, click() {},
      querySelector: () => el(), querySelectorAll: () => [], closest: () => null,
      getContext: () => ({ canvas: {}, clearRect() {}, fillRect() {}, beginPath() {}, stroke() {} }),
      insertAdjacentHTML() {}, cloneNode: () => el(),
    };
  }

  static _resonant() {
    return {
      add() {}, addAll() {}, persist() {}, updatePersistantData() {},
      computed() {}, bindEvents() {}, updateElement() {},
      updateDisplayConditionalsFor() {}, updateStylesFor() {},
      addCallback() {}, registerTemplate() {}, handler() {}, transform() {},
      processIncludes() { return this; }, format() {}, stream() {},
      bindByCssSelector() {},
    };
  }

  static _ambient() {
    const el = LiveArtifactStubs._element;
    return {
      document: {
        createElement: () => el(), createTextNode: () => el(),
        querySelector: () => el(), querySelectorAll: () => [],
        addEventListener() {}, body: el(),
      },
      fetch: async () => ({ ok: false, status: 0, text: async () => '', json: async () => ({}) }),
      setTimeout: (fn) => { try { fn(); } catch (_) {} return 0; },
      setInterval: () => 0,
      clearTimeout() {}, clearInterval() {},
      requestAnimationFrame: (fn) => { try { fn(0); } catch (_) {} return 0; },
      window: { addEventListener() {}, location: { href: '' } },
    };
  }
}

module.exports = LiveArtifactStubs;
