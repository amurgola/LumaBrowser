class Int8ConvrotRecipes {
  static RECIPES = Object.freeze({
    anima: Object.freeze({
      layerPattern: /^(?:net|model\.diffusion_model)\.blocks\.\d+\.(?:mlp\.layer\d|self_attn\.(?:[qkv]|output)_proj|cross_attn\.(?:[qkv]|output)_proj)\.weight$/,
    }),
  });

  static forFamily(family) {
    return Int8ConvrotRecipes.RECIPES[family] || null;
  }
}

module.exports = Int8ConvrotRecipes;
