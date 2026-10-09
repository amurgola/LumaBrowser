class ElementSampler {
  static indices(length, limit) {
    if (length <= limit) return Array.from({ length }, (_, i) => i);
    if (limit <= 1) return limit === 1 ? [0] : [];
    const step = (length - 1) / (limit - 1);
    return Array.from({ length: limit }, (_, i) => Math.round(i * step));
  }
}

module.exports = ElementSampler;
