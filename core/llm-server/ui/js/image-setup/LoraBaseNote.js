export default class LoraBaseNote {
  static describe(row, modelFamily) {
    const parts = [];
    let warn = false;
    if (row && row.base && row.base.label) {
      if (row.families && row.families.length && modelFamily && !row.families.includes(modelFamily)) {
        warn = true;
        parts.push(`This LoRA was trained for ${row.base.label}, but this model's family is ${modelFamily}. It will likely have no effect or degrade output.`);
      } else {
        parts.push(`Trained for ${row.base.label}.`);
      }
    }
    if (row && (row.form === 'lokr' || row.form === 'loha')) {
      parts.push(`LyCORIS ${row.form === 'lokr' ? 'LoKr' : 'LoHa'} format; needs a recent sd.cpp runtime to apply.`);
    }
    return { text: parts.join(' '), warn };
  }
}
