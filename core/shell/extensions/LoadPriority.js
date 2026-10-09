class LoadPriority {
  static DEFAULT = 100;

  static of(manifest) {
    return (manifest && manifest.loadPriority) || LoadPriority.DEFAULT;
  }

  static sort(ids, manifests) {
    return [...ids].sort((a, b) => LoadPriority.of(manifests.get(a)) - LoadPriority.of(manifests.get(b)));
  }

  static insert(order, id, manifests) {
    if (order.includes(id)) return;
    const priority = LoadPriority.of(manifests.get(id));
    const index = order.findIndex((other) => priority < LoadPriority.of(manifests.get(other)));
    order.splice(index < 0 ? order.length : index, 0, id);
  }
}

module.exports = LoadPriority;
