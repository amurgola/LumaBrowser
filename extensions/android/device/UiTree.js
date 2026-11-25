class UiTree {
  static DUMP_PATH = '/sdcard/luma-window.xml';

  constructor(shell) {
    this._shell = shell;
  }

  async capture() {
    const startedAt = Date.now();
    const xml = await this._shell(`uiautomator dump ${UiTree.DUMP_PATH} >/dev/null 2>&1; cat ${UiTree.DUMP_PATH}`);
    return { elements: UiTree.parse(xml), millis: Date.now() - startedAt };
  }

  static parse(xml) {
    const elements = [];
    for (const node of String(xml || '').matchAll(/<node ([^>]*?)\/?>/g)) {
      const element = UiTree._describe(node[1]);
      if (element) elements.push(element);
    }
    return elements;
  }

  static format(elements) {
    if (!elements.length) return 'Nothing on screen has a label or can be tapped.';
    return elements.map((element) => {
      const label = element.label ? ` "${element.label}"` : '';
      const id = !element.label && element.id ? ` #${element.id}` : '';
      return `[${element.x},${element.y}] ${element.role}${label}${id}${element.clickable ? ' (tap)' : ''}`;
    }).join('\n');
  }

  static _describe(attributes) {
    const attribute = (name) => (new RegExp(`(?:^| )${name}="([^"]*)"`).exec(attributes) || [])[1] || '';
    const label = UiTree._decode(attribute('text') || attribute('content-desc'));
    const clickable = attribute('clickable') === 'true';
    const bounds = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(attribute('bounds'));
    if (!bounds || (!label && !clickable)) return null;
    const [left, top, right, bottom] = bounds.slice(1).map(Number);
    return {
      label,
      role: attribute('class').split('.').pop(),
      id: attribute('resource-id').split('/').pop(),
      clickable,
      x: Math.round((left + right) / 2),
      y: Math.round((top + bottom) / 2),
    };
  }

  static _decode(text) {
    return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#10;/g, ' ').replace(/&amp;/g, '&');
  }
}

module.exports = UiTree;
