import Dom from '../../dom/Dom.js';
import SchemaField from './SchemaField.js';
import ImageGenerator from '../ImageGenerator.js';
import FileBase64 from '../FileBase64.js';
import QuickPrompt from '../QuickPrompt.js';

export default class ImageField extends SchemaField {
  static get types() {
    return ['image'];
  }

  render(wrap, spec) {
    const { field, model } = spec;
    const row = Dom.el('div', 'cm-ximg');
    const preview = Dom.el('img', 'cm-ximg-prev');
    const current = model[field.key];
    if (current && current.b64) preview.src = 'data:' + (current.mime || 'image/png') + ';base64,' + current.b64;
    const actions = Dom.el('div', 'cm-ximg-actions');
    ImageField._appendUpload(actions, preview, field, model);
    if (field.generate !== false) actions.appendChild(ImageField._generateButton(wrap, preview, spec));
    row.appendChild(preview);
    row.appendChild(actions);
    wrap.appendChild(row);
  }

  static _appendUpload(actions, preview, field, model) {
    const upload = Dom.el('button', 'luma-btn', 'Upload');
    upload.type = 'button';
    const fileInput = Dom.el('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    upload.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const read = await FileBase64.read(file);
      if (read) { model[field.key] = read; preview.src = 'data:' + read.mime + ';base64,' + read.b64; }
    });
    actions.appendChild(upload);
    actions.appendChild(fileInput);
  }

  static _generateButton(wrap, preview, spec) {
    const button = Dom.el('button', 'luma-btn', 'Generate');
    button.type = 'button';
    button.addEventListener('click', () => ImageField._generate(button, wrap, preview, spec));
    return button;
  }

  static async _generate(button, wrap, preview, { field, model, api, siblingModel, rootModel }) {
    const subject = await ImageField._subject(field, siblingModel);
    if (subject == null) return;
    button.disabled = true;
    button.textContent = 'Generating…';
    const res = await ImageGenerator.generate(api, ImageField._request(field, rootModel, subject));
    button.disabled = false;
    if (res && res.b64) {
      model[field.key] = { b64: res.b64, mime: res.mime };
      preview.src = ImageGenerator.dataUri(res);
      button.textContent = 'Regenerate';
    } else {
      ImageField._showError(button, wrap, res);
    }
  }

  static async _subject(field, siblingModel) {
    if (field.genFromKey && siblingModel && siblingModel[field.genFromKey]) return String(siblingModel[field.genFromKey]);
    return QuickPrompt.open('Describe the image to generate');
  }

  static _request(field, rootModel, subject) {
    const fromRoot = (key) => (key && rootModel && rootModel[key] ? String(rootModel[key]) : '');
    const prompt = [field.promptPrefix || '', fromRoot(field.styleFromKey), subject]
      .map((p) => String(p || '').trim()).filter(Boolean).join(', ');
    return {
      prompt,
      modelRef: fromRoot(field.modelFromKey) || undefined,
      width: field.width || 512,
      height: field.height || 512,
      steps: field.steps || 24,
    };
  }

  static _showError(button, wrap, res) {
    button.textContent = 'Generate';
    button.title = (res && res.error) || 'Generation failed';
    let line = wrap.querySelector('.cm-ximg-err');
    if (!line) {
      line = Dom.el('div', 'luma-form-err cm-ximg-err');
      wrap.appendChild(line);
    }
    line.textContent = (res && res.error) || 'Generation failed.';
  }
}
