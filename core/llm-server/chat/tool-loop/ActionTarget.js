class ActionTarget {
  static POINT_CELL_PX = 24;

  static of(name, params) {
    const args = params && typeof params === 'object' ? params : {};
    switch (name) {
      case 'click_at': return ActionTarget._point(args);
      case 'scroll': return args.selector ? `selector:${args.selector}` : `direction:${args.direction || 'down'}`;
      case 'locate': return `described:${ActionTarget._fold(args.description)}`;
      case 'press_key': return `key:${args.key}@${ActionTarget._element(args)}`;
      case 'click': return args.text ? `${ActionTarget._element(args)}#${args.text}` : ActionTarget._element(args);
      default: return ActionTarget._element(args);
    }
  }

  static _point(args) {
    const cell = (v) => Math.floor(Number(v) / ActionTarget.POINT_CELL_PX);
    return `point:${cell(args.x)},${cell(args.y)}`;
  }

  static _element(args) {
    if (args.ref != null) return `ref:${args.ref}`;
    if (args.selector) return `selector:${args.selector}`;
    return 'page';
  }

  static _fold(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
}

module.exports = ActionTarget;
