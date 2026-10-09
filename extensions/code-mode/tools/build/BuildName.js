class BuildName {
  static FALLBACK = 'my-extension';
  static TASK_WORDS = 4;

  static derive(meta) {
    const d = (meta && meta.data) || {};
    return BuildName._text(d.name) || BuildName._text(d.targetId) || BuildName._taskSlug(d.task) || BuildName.FALLBACK;
  }

  static _taskSlug(task) {
    const text = BuildName._text(task);
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
      .slice(0, BuildName.TASK_WORDS).join('-');
  }

  static _text(value) {
    return (value && String(value).trim()) || '';
  }
}

module.exports = BuildName;
