class TreePruner {
  prune(root) {
    this._walk(root);
    return root;
  }

  shouldDrop(_node) {
    return false;
  }

  _walk(node) {
    for (const child of node.elementChildren()) {
      if (this.shouldDrop(child)) child.remove();
      else this._walk(child);
    }
  }
}

module.exports = TreePruner;
