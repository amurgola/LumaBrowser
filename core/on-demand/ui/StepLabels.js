export default class StepLabels {
  static ELLIPSIS = String.fromCharCode(0x2026);

  static VERBS = {
    observe_page: () => 'Looking at the page',
    click: (p) => 'Clicking ' + StepLabels.target(p),
    type: (p) => 'Typing "' + StepLabels.short(p && p.text) + '"' + (p && p.submit ? ' and pressing Enter' : ''),
    fill_form: () => 'Filling the form',
    press_key: (p) => 'Pressing ' + (p && p.key ? p.key : 'a key'),
    scroll: (p) => 'Scrolling ' + (p && p.direction ? p.direction : ''),
    navigate: (p) => 'Opening ' + StepLabels.short(p && p.url, 48),
    get_source: () => 'Reading the page',
    screenshot: () => 'Taking a look',
    wait_for: () => 'Waiting for the page',
    get_element: () => 'Inspecting an element',
    extract_data: () => 'Extracting data',
    collect_list: () => 'Collecting the list',
    select_option: (p) => 'Choosing ' + (p && p.option ? '"' + StepLabels.short(p.option) + '"' : 'an option'),
    set_date: (p) => 'Setting the date' + (p && p.date ? ' to ' + StepLabels.short(p.date) : ''),
    set_slider: (p) => 'Setting the slider' + (p && p.value != null ? ' to ' + p.value : ''),
    get_tabs: () => 'Checking open tabs',
    search_knowledge_base: () => 'Checking my notes',
    activate_tools: () => 'Getting ready',
  };

  static label(tool, params) {
    const fn = Object.prototype.hasOwnProperty.call(StepLabels.VERBS, tool) ? StepLabels.VERBS[tool] : null;
    return fn ? fn(params) : 'Using ' + String(tool).replace(/_/g, ' ');
  }

  static short(s, n = 40) {
    const text = String(s == null ? '' : s);
    return text.length > n ? text.slice(0, n - 1) + StepLabels.ELLIPSIS : text;
  }

  static target(p) {
    if (!p) return 'an element';
    if (p.ref != null) return '[' + p.ref + ']';
    if (p.text) return '"' + StepLabels.short(p.text) + '"';
    if (p.selector) return StepLabels.short(p.selector, 30);
    return 'an element';
  }
}
