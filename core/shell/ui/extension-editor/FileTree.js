export default class FileTree {
  constructor(el) {
    this._el = el;
  }

  render(files, onOpen) {
    this._el.innerHTML = '';
    for (const file of files) {
      const item = this._el.ownerDocument.createElement('div');
      item.className = 'file-item';
      item.textContent = file;
      item.title = file;
      item.addEventListener('click', () => onOpen(file));
      this._el.appendChild(item);
    }
  }

  markActive(fileName) {
    this._el.querySelectorAll('.file-item').forEach((el) => {
      el.classList.toggle('active', el.textContent === fileName);
    });
  }
}
