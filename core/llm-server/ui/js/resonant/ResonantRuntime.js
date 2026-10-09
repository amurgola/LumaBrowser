export default class ResonantRuntime {
  static _shared = null;

  static isLoaded() {
    return typeof window !== 'undefined' && typeof window.Resonant === 'function';
  }

  static constructorClass() {
    if (!ResonantRuntime.isLoaded()) {
      throw new Error('ResonantJs is not loaded: add <script src="/llm-ui/resonant.js"></script> before the module entry');
    }
    return window.Resonant;
  }

  static shared() {
    if (!ResonantRuntime._shared) {
      const Resonant = ResonantRuntime.constructorClass();
      ResonantRuntime._shared = new Resonant();
    }
    return ResonantRuntime._shared;
  }

  static scoped(rootElement) {
    const Resonant = ResonantRuntime.constructorClass();
    return new Resonant({ rootElement, bindToWindow: false });
  }

  static reset() {
    ResonantRuntime._shared = null;
  }
}
