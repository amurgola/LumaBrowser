class BoundedParallel {
  static async map(items, limit, fn) {
    const out = new Array(items.length);
    let cursor = 0;
    const lane = async () => {
      while (cursor < items.length) {
        const index = cursor++;
        out[index] = await fn(items[index], index);
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
    return out;
  }
}

module.exports = BoundedParallel;
