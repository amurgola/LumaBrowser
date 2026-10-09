export default class ResonantTemplates {
  static ML_ROW = '<div class="model-row">'
    + '<div class="model-row-head" res-onclick="res.mltoggle">'
    + '<span class="model-caret" aria-hidden="true" '
    + 'res-style="(caretEmpty ? \'is-empty \' : \'\') + (expanded ? \'is-open\' : \'\')"></span>'
    + '<span class="model-name" res-prop="name"></span>'
    + '<span class="model-rename-slot" res-prop="renameHtml" res-html></span>'
    + '<span class="model-row-tags" res-prop="tagsHtml" res-html></span>'
    + '<span class="model-size" res-prop="sizeText"></span>'
    + '</div>'
    + '<div class="model-details" res-style="expanded ? \'is-open\' : \'is-collapsed\'">'
    + '<div class="ml-block ml-meta" res-prop="metaHtml" res-html></div>'
    + '<div class="ml-block" res-prop="ctxFitHtml" res-html></div>'
    + '<div class="ml-block" res-prop="fitHtml" res-html></div>'
    + '<div class="ml-block" res-prop="quantHtml" res-html></div>'
    + '<div class="ml-block" res-prop="dlHtml" res-html></div>'
    + '<div class="ml-block" res-prop="blurbHtml" res-html></div>'
    + '<div class="ml-block" res-prop="shardsHtml" res-html></div>'
    + '<div class="model-row-actions ml-block" res-prop="actionsHtml" res-html></div>'
    + '</div>'
    + '</div>';

  static TEMPLATES = { mlRow: ResonantTemplates.ML_ROW };

  static registerAll(resonant) {
    if (!resonant || typeof resonant.registerTemplate !== 'function') return false;
    for (const [name, html] of Object.entries(ResonantTemplates.TEMPLATES)) resonant.registerTemplate(name, html);
    return true;
  }
}
