class LoraBaseDetector {
  static BASES = {
    'sd-1-5': { label: 'SD 1.5', families: ['sd-1-5'] },
    sdxl: { label: 'SDXL', families: ['sdxl'] },
    'sd-unet': { label: 'SD UNet (1.5 or SDXL)', families: ['sdxl', 'sd-1-5'] },
    flux: { label: 'FLUX.1', families: ['flux', 'chroma'] },
    'flux-line': { label: 'FLUX family', families: ['flux', 'chroma', 'flux2'] },
    flux2: { label: 'FLUX.2', families: ['flux2'] },
    chroma: { label: 'Chroma', families: ['chroma', 'flux'] },
    'qwen-image': { label: 'Qwen-Image', families: ['qwen-image-edit'] },
    'qwen-image-2-1': { label: 'Qwen-Image 2.1', families: ['qwen-image-2'] },
    'z-image': { label: 'Z-Image', families: ['z-image'] },
    krea2: { label: 'Krea 2', families: ['krea2'] },
    'wan-video': { label: 'Wan video', families: ['wan-video'] },
    'minimax-h3': { label: 'MiniMax-H3', families: ['minimax-h3'] },
  };

  static METADATA_RULES = [
    ['krea2', (v) => v.includes('krea')],
    ['qwen-image-2-1', (v) => v.includes('qwen') && /(?:^|[^0-9])2[._-]?1(?:[^0-9]|$)|qwen[-_ ]?image[-_ ]?2\b/.test(v)],
    ['qwen-image', (v) => v.includes('qwen')],
    ['z-image', (v) => /z[-_.]?image/.test(v)],
    ['chroma', (v) => v.includes('chroma')],
    ['flux2', (v) => /flux[-_.]?2|flux\.2/.test(v)],
    ['flux', (v) => v.includes('flux') || v.includes('flex')],
    ['wan-video', (v) => v.includes('wan')],
    ['minimax-h3', (v) => v.includes('minimax')],
    ['sdxl', (v) => v.includes('sdxl') || v.includes('stable-diffusion-xl')],
    ['sd-1-5', (v) => /sd_?v?1[-._]?5|stable-diffusion-v1/.test(v)],
  ];

  static KEY_RULES = [
    ['krea2', (has) => has(/txtfusion/)],
    ['flux-line', (has) => (has(/double_blocks[._]/) && has(/single_blocks[._]/)) || has(/single_transformer_blocks[._]/)],
    ['qwen-image-2-1', (has) => has(/transformer_blocks[._]\d+[._]img_mlp[._](?:gate_layer|gate_up|proj|out)/)
      && !has(/txt_(?:mod|mlp)|img_mod|add_[qkv]_proj/)],
    ['qwen-image', (has) => has(/transformer_blocks[._]\d+[._]/) && has(/img_(?:mod|mlp)|txt_(?:mod|mlp)|add_[qkv]_proj/)],
    ['wan-video', (has) => has(/blocks[._]\d+[._](?:self_attn|cross_attn)/)],
    ['sdxl', (has) => LoraBaseDetector._isSdUnet(has) && has(/(?:^|\n)lora_te2_/)],
    ['sd-unet', (has) => LoraBaseDetector._isSdUnet(has)],
  ];

  static fromMetadata(value) {
    const text = String(value || '').toLowerCase();
    if (!text) return null;
    const rule = LoraBaseDetector.METADATA_RULES.find(([, matches]) => matches(text));
    return rule ? rule[0] : null;
  }

  static fromKeys(keys) {
    const joined = `\n${keys.join('\n')}\n`;
    const has = (re) => re.test(joined);
    const rule = LoraBaseDetector.KEY_RULES.find(([, matches]) => matches(has));
    return rule ? rule[0] : null;
  }

  static _isSdUnet(has) {
    return has(/(?:input_blocks|output_blocks|middle_block|down_blocks|up_blocks|mid_block)[._]/);
  }
}

module.exports = LoraBaseDetector;
