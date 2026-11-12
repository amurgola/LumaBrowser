class BoundsGeometryCheck {
  static MODAL_FAILURE = 'Native view bounds failed modal open/close verification';
  static PANEL_FAILURE = 'Native view bounds failed descendant resize/ancestor visibility verification';
  static PANEL_GROWTH = 100;

  static problem(g) {
    if (!BoundsGeometryCheck._modalsCollapse(g)) return BoundsGeometryCheck.MODAL_FAILURE;
    if (!BoundsGeometryCheck._panelShrinks(g)) return BoundsGeometryCheck.PANEL_FAILURE;
    return null;
  }

  static verify(g) {
    const problem = BoundsGeometryCheck.problem(g);
    if (problem) throw new Error(problem);
    return g;
  }

  static _modalsCollapse(g) {
    return g.modal.width === 0 && g.dynamicModal.width === 0 && g.restored.width > 0
      && g.afterRemove.width === g.restored.width;
  }

  static _panelShrinks(g) {
    return g.narrow.width < g.restored.width
      && g.wider.width === g.narrow.width - BoundsGeometryCheck.PANEL_GROWTH
      && g.hiddenByAncestor.width === g.restored.width;
  }
}

module.exports = BoundsGeometryCheck;
