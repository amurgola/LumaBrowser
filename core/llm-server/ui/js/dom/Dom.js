export default class Dom {
  static el(tag, cls, html) {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (html != null) element.innerHTML = html;
    return element;
  }

  static byId(id) {
    return document.getElementById(id);
  }
}
