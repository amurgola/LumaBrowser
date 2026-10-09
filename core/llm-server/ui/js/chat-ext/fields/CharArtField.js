import SchemaField from './SchemaField.js';
import CharArtStudio from './CharArtStudio.js';

export default class CharArtField extends SchemaField {
  static get types() {
    return ['charart'];
  }

  render(wrap, { field, model, api, siblingModel, rootModel }) {
    const current = model[field.key];
    const art = current && typeof current === 'object' ? current : (model[field.key] = {});
    wrap.appendChild(new CharArtStudio({ field, art, api, siblingModel, rootModel }).build());
  }
}
