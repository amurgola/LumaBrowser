export default class HtmlPatcher {
  static apply(el, html) {
    const template = el.ownerDocument.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    return HtmlPatcher._patchChildren(el, [...template.content.childNodes]);
  }

  static _patchChildren(el, fresh) {
    const have = [...el.childNodes];
    let kept = 0;
    while (kept < fresh.length && kept < have.length && HtmlPatcher._same(have[kept], fresh[kept])) kept++;
    if (kept < fresh.length && kept < have.length && HtmlPatcher._sameShell(have[kept], fresh[kept])) {
      HtmlPatcher._patchChildren(have[kept], [...fresh[kept].childNodes]);
      kept++;
    }
    for (let i = have.length - 1; i >= kept; i--) have[i].remove();
    for (let i = kept; i < fresh.length; i++) el.appendChild(fresh[i]);
    return kept;
  }

  static _same(a, b) {
    if (a.nodeType !== b.nodeType) return false;
    if (a.nodeType === 3) return a.nodeValue === b.nodeValue;
    if (a.nodeType === 1) return a.outerHTML === b.outerHTML;
    return false;
  }

  static _sameShell(a, b) {
    if (a.nodeType !== 1 || b.nodeType !== 1 || a.tagName !== b.tagName) return false;
    if (a.attributes.length !== b.attributes.length) return false;
    for (const { name, value } of a.attributes) if (b.getAttribute(name) !== value) return false;
    return true;
  }
}
