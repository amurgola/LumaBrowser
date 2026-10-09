export default class WidgetDom {
  static MINUTE_MS = 60000;
  static HOUR_MS = 3600000;
  static DAY_MS = 86400000;

  static esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  static el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) WidgetDom._applyAttr(node, key, value);
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  static relativeTime(iso, now = Date.now()) {
    if (!iso) return '';
    const time = new Date(iso).getTime();
    if (Number.isNaN(time)) return '';
    const diff = now - time;
    if (diff < WidgetDom.MINUTE_MS) return 'just now';
    if (diff < WidgetDom.HOUR_MS) return `${Math.round(diff / WidgetDom.MINUTE_MS)} min ago`;
    if (diff < WidgetDom.DAY_MS) return `${Math.round(diff / WidgetDom.HOUR_MS)} h ago`;
    return `${Math.round(diff / WidgetDom.DAY_MS)} d ago`;
  }

  static formatTime(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  static formatTimeRange(startIso, endIso, allDay) {
    if (allDay) return 'All day';
    const start = WidgetDom.formatTime(startIso);
    const end = endIso ? WidgetDom.formatTime(endIso) : '';
    return end && end !== start ? `${start} to ${end}` : start;
  }

  static formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  static dayKey(iso, now = null) {
    const date = iso ? new Date(iso) : new Date(now == null ? Date.now() : now);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  static dayLabel(dayKey, now = Date.now()) {
    if (dayKey === WidgetDom.dayKey(null, now)) return 'Today';
    if (dayKey === WidgetDom.dayKey(null, now + WidgetDom.DAY_MS)) return 'Tomorrow';
    const date = new Date(`${dayKey}T12:00:00`);
    if (Number.isNaN(date.getTime())) return dayKey;
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  static _applyAttr(node, key, value) {
    if (value == null || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'data') for (const [k, v] of Object.entries(value)) node.dataset[k] = v;
    else if (key === 'on') for (const [event, fn] of Object.entries(value)) node.addEventListener(event, fn);
    else if (key === 'style') node.setAttribute('style', value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
}
