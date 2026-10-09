class ComponentFilter {
  static keepLargest(keyed) {
    const { W, H } = keyed;
    const mask = keyed.keyed;
    const { labels, sizes } = ComponentFilter._label(mask, W, H);
    if (sizes.length < 2) return 0;
    let mainLabel = 1;
    for (let i = 1; i < sizes.length; i += 1) if (sizes[i] > sizes[mainLabel - 1]) mainLabel = i + 1;
    for (let p = 0; p < W * H; p += 1) {
      if (labels[p] && labels[p] !== mainLabel) mask[p] = 1;
    }
    return sizes.length - 1;
  }

  static _label(mask, W, H) {
    const labels = new Int32Array(W * H);
    const sizes = [];
    const stack = [];
    let next = 0;
    for (let start = 0; start < W * H; start += 1) {
      if (mask[start] || labels[start]) continue;
      next += 1;
      labels[start] = next;
      stack.length = 0;
      stack.push(start);
      sizes.push(ComponentFilter._flood(mask, labels, stack, next, W, H));
    }
    return { labels, sizes };
  }

  static _flood(mask, labels, stack, label, W, H) {
    let size = 0;
    const visit = (q) => { if (!mask[q] && !labels[q]) { labels[q] = label; stack.push(q); } };
    while (stack.length) {
      const p = stack.pop();
      size += 1;
      const x = p % W;
      if (x > 0) visit(p - 1);
      if (x < W - 1) visit(p + 1);
      if (p >= W) visit(p - W);
      if (p < W * (H - 1)) visit(p + W);
    }
    return size;
  }
}

module.exports = ComponentFilter;
