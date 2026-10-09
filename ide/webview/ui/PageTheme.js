export default class PageTheme {
  static apply(root, vars) {
    for (const k of Object.keys(vars || {})) root.style.setProperty(k, vars[k]);
    const dark = String((vars && vars['--ide-dark']) || '1') !== '0';
    if (dark) root.removeAttribute('data-light');
    else root.setAttribute('data-light', '1');
  }
}
