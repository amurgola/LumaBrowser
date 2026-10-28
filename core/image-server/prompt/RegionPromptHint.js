class RegionPromptHint {
  static WHOLE_SHARE = 0.6;

  static build({ bounds, width, height, coverage }) {
    const box = RegionPromptHint._box(bounds, width, height);
    const where = box ? RegionPromptHint.place(bounds, width, height) : 'the marked area';
    const span = box ? ` (a box spanning ${box.x0}% to ${box.x1}% of the width and ${box.y0}% to ${box.y1}% of the height` : '';
    const share = RegionPromptHint._percent(coverage);
    const size = share != null ? `${span ? ', ' : ' ('}about ${share}% of the picture)` : (span ? ')' : '');
    return `Apply the change only inside the marked area of the image: ${where}${span}${size}. `
      + 'Leave everything outside that area exactly as it is: same subject, colours, lighting and framing.';
  }

  static place(bounds, width, height) {
    if (!bounds || !(width > 0) || !(height > 0)) return 'the marked area';
    if (bounds.width / width >= RegionPromptHint.WHOLE_SHARE && bounds.height / height >= RegionPromptHint.WHOLE_SHARE) return 'most of the image';
    const cx = (bounds.x + bounds.width / 2) / width;
    const cy = (bounds.y + bounds.height / 2) / height;
    const row = cy < 1 / 3 ? 'upper' : (cy < 2 / 3 ? 'middle' : 'lower');
    const col = cx < 1 / 3 ? 'left' : (cx < 2 / 3 ? 'centre' : 'right');
    if (row === 'middle' && col === 'centre') return 'the centre';
    return `the ${row} ${col} part`;
  }

  static _box(bounds, width, height) {
    if (!bounds || !(width > 0) || !(height > 0)) return null;
    const pct = (v, total) => Math.max(0, Math.min(100, Math.round((v / total) * 100)));
    return {
      x0: pct(bounds.x, width), x1: pct(bounds.x + bounds.width, width),
      y0: pct(bounds.y, height), y1: pct(bounds.y + bounds.height, height),
    };
  }

  static _percent(coverage) {
    if (typeof coverage !== 'number' || !Number.isFinite(coverage)) return null;
    return Math.max(1, Math.round(coverage * 100));
  }
}

module.exports = RegionPromptHint;
