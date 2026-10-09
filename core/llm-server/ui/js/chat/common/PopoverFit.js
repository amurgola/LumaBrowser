export default class PopoverFit {
  static MARGIN = 16;

  static clipTop(el, root) {
    let top = 0;
    for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.overflowY !== 'visible' || s.overflowX !== 'visible') {
        top = Math.max(top, p.getBoundingClientRect().top);
      }
    }
    return top;
  }

  static fitShrinkingChild(pop, child, root, minPanel) {
    pop.style.bottom = '';
    if (child) child.style.maxHeight = '';
    const rect = pop.getBoundingClientRect();
    const clipTop = PopoverFit.clipTop(pop, root);
    const overflow = clipTop + PopoverFit.MARGIN - rect.top;
    if (overflow <= 0) return;
    const floor = Math.min(minPanel, window.innerHeight - clipTop - PopoverFit.MARGIN * 2);
    let shrink = 0;
    if (child) {
      const childH = child.getBoundingClientRect().height;
      shrink = Math.min(overflow, Math.max(0, childH - 72), Math.max(0, rect.height - floor));
      if (shrink > 0) child.style.maxHeight = (childH - shrink) + 'px';
    }
    PopoverFit._slideDown(pop, overflow - shrink);
  }

  static fitScrolling(pop, root, minHeight) {
    const rect = pop.getBoundingClientRect();
    const overTop = PopoverFit.clipTop(pop, root) + PopoverFit.MARGIN - rect.top;
    if (overTop <= 0) return;
    const shrink = Math.min(overTop, Math.max(0, rect.height - minHeight));
    if (shrink > 0) {
      pop.style.maxHeight = (rect.height - shrink) + 'px';
      pop.style.overflowY = 'auto';
    }
    PopoverFit._slideDown(pop, overTop - shrink);
  }

  static _slideDown(pop, remaining) {
    if (remaining > 0) pop.style.bottom = 'calc(100% + 8px - ' + remaining + 'px)';
  }
}
