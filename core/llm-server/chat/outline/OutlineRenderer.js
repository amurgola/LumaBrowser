class OutlineRenderer {
  static render(root, plan) {
    const lines = [];
    OutlineRenderer._write(root, plan, lines);
    return lines.join('\n');
  }

  static _write(node, plan, lines) {
    lines.push(node.line(plan.detailed.has(node)));
    for (const child of node.children) {
      if (plan.admitted.has(child)) OutlineRenderer._write(child, plan, lines);
    }
    if (plan.hidden.has(node)) lines.push(node.moreLine(plan.hidden.get(node)));
  }
}

module.exports = OutlineRenderer;
