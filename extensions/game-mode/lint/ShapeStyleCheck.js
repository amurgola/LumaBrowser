class ShapeStyleCheck {
  static SHAPE_ADDER = /\badd\.(rectangle|circle|ellipse|triangle|polygon|star|arc|grid|isobox|isotriangle)\s*\(/;
  static GRAPHICS_ADDER = /\badd\.graphics\s*\(/;
  static STYLE_CALL = /\.(fillStyle|lineStyle|setFillStyle|setStrokeStyle)\s*\(/g;
  static LOOKBACK = 400;

  static findings(text) {
    const out = [];
    const re = new RegExp(ShapeStyleCheck.STYLE_CALL.source, 'g');
    let m;
    while ((m = re.exec(text))) {
      const finding = ShapeStyleCheck._check(m[1], ShapeStyleCheck._statementBefore(text, m.index));
      if (finding) out.push({ index: m.index, ...finding });
    }
    return out;
  }

  static _statementBefore(text, index) {
    const win = text.slice(Math.max(0, index - ShapeStyleCheck.LOOKBACK), index);
    const cut = Math.max(win.lastIndexOf(';'), win.lastIndexOf('{'), win.lastIndexOf('}'));
    return cut === -1 ? win : win.slice(cut + 1);
  }

  static _check(method, stmt) {
    const graphicsMethod = method === 'fillStyle' || method === 'lineStyle';
    if (graphicsMethod && ShapeStyleCheck.SHAPE_ADDER.test(stmt)) {
      return {
        id: 'shape-fillstyle',
        message: `add.${ShapeStyleCheck.SHAPE_ADDER.exec(stmt)[1]}() returns a Shape; Shapes use setFillStyle(color, alpha) `
          + `and setStrokeStyle(width, color); ${method}() is a Graphics method and throws here.`,
      };
    }
    if (!graphicsMethod && ShapeStyleCheck.GRAPHICS_ADDER.test(stmt)) {
      return {
        id: 'graphics-setfillstyle',
        message: `Graphics objects use fillStyle(color, alpha) / lineStyle(width, color); ${method}() is a `
          + 'Shape method and throws on a Graphics object.',
      };
    }
    return null;
  }
}

module.exports = ShapeStyleCheck;
