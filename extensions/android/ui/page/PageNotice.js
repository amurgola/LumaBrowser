export default class PageNotice {
  constructor(root = document.getElementById('notice')) {
    this._root = root;
    this._text = root.querySelector('#notice-text');
    this._list = root.querySelector('#notice-list');
    this._action = root.querySelector('#notice-action');
  }

  show(text, action = null) {
    this._root.hidden = false;
    this._text.textContent = text;
    this._list.replaceChildren();
    this._action.hidden = !action;
    if (action) {
      this._action.textContent = action.label;
      this._action.onclick = action.run;
    }
  }

  choose(text, choices) {
    this.show(text);
    this._list.replaceChildren(...choices.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice.label;
      button.addEventListener('click', choice.run);
      return button;
    }));
  }

  hide() {
    this._root.hidden = true;
  }
}
