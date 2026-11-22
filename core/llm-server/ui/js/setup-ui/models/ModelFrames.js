export default class ModelFrames {
  static SERVED = 'served';

  static MISSING = 'missing';

  static UNLOADABLE = 'unloadable';

  static COMPANION = 'companion';

  static split(models, frameworks) {
    const frames = new Map();
    for (const model of models || []) ModelFrames._add(frames, model);
    return ModelFrames._ordered([...frames.values()], ModelFrames._frameworkOrder(frameworks));
  }

  static _add(frames, model) {
    const served = model.servedBy || {};
    const kind = ModelFrames._kindOf(served);
    const key = kind === ModelFrames.SERVED || kind === ModelFrames.MISSING ? `${kind}:${served.frameworkId}` : kind;
    if (!frames.has(key)) {
      frames.set(key, { key, kind, frameworkId: served.frameworkId || null, runtimeId: served.runtimeId || null, formats: [], models: [] });
    }
    const frame = frames.get(key);
    frame.models.push(model);
    if (served.format && !frame.formats.includes(served.format)) frame.formats.push(served.format);
  }

  static _kindOf(served) {
    if (served.frameworkId) return served.installed ? ModelFrames.SERVED : ModelFrames.MISSING;
    return served.format ? ModelFrames.UNLOADABLE : ModelFrames.COMPANION;
  }

  static _frameworkOrder(frameworks) {
    const view = frameworks && frameworks.view;
    return view && Array.isArray(view.frameworks) ? view.frameworks.map((framework) => framework.id) : [];
  }

  static _ordered(frames, viewOrder) {
    const order = viewOrder.concat(frames.map((frame) => frame.frameworkId).filter(Boolean));
    const rank = (frame) => {
      if (frame.kind === ModelFrames.UNLOADABLE) return [Infinity, 0];
      if (frame.kind === ModelFrames.COMPANION) return [Infinity, 1];
      return [order.indexOf(frame.frameworkId), frame.kind === ModelFrames.SERVED ? 0 : 1];
    };
    return frames.slice().sort((a, b) => {
      const [aFramework, aState] = rank(a);
      const [bFramework, bState] = rank(b);
      if (aFramework !== bFramework) return aFramework < bFramework ? -1 : 1;
      return aState - bState;
    });
  }
}
