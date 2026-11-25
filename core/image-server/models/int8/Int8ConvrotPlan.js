const SafetensorsHeader = require('../SafetensorsHeader');
const HadamardRotation = require('./HadamardRotation');
const TensorFloats = require('./TensorFloats');

class Int8ConvrotPlan {
  static WEIGHT_SUFFIX = '.weight';
  static QUANT_CONFIG = Object.freeze({ format: 'int8_tensorwise', convrot: true, convrot_groupsize: HadamardRotation.GROUP });

  static build(sourceHeader, layerPattern) {
    const plan = { header: {}, entries: [], dataBytes: 0, layers: 0 };
    const metadata = sourceHeader[SafetensorsHeader.METADATA_KEY];
    if (metadata) plan.header[SafetensorsHeader.METADATA_KEY] = metadata;
    for (const name of Int8ConvrotPlan._namesInFileOrder(sourceHeader)) {
      const tensor = sourceHeader[name];
      if (Int8ConvrotPlan.converts(sourceHeader, name, layerPattern)) Int8ConvrotPlan._addLayer(plan, name, tensor);
      else Int8ConvrotPlan._addCopy(plan, name, tensor);
    }
    return plan;
  }

  static converts(sourceHeader, name, layerPattern) {
    const tensor = sourceHeader[name];
    if (!name.endsWith(Int8ConvrotPlan.WEIGHT_SUFFIX) || !layerPattern.test(name)) return false;
    if (!tensor || !Array.isArray(tensor.shape) || tensor.shape.length !== 2 || !TensorFloats.supports(tensor.dtype)) return false;
    const module = Int8ConvrotPlan._moduleOf(name);
    if (sourceHeader[`${module}.weight_scale`] || sourceHeader[`${module}.comfy_quant`]) return false;
    return HadamardRotation.supports(tensor.shape[1]);
  }

  static quantConfigBytes() {
    return Buffer.from(JSON.stringify(Int8ConvrotPlan.QUANT_CONFIG), 'utf8');
  }

  static _namesInFileOrder(sourceHeader) {
    return SafetensorsHeader.tensorNames(sourceHeader)
      .sort((a, b) => sourceHeader[a].data_offsets[0] - sourceHeader[b].data_offsets[0]);
  }

  static _addCopy(plan, name, tensor) {
    const [begin, end] = tensor.data_offsets;
    const targetOffset = Int8ConvrotPlan._place(plan, name, tensor.dtype, tensor.shape, end - begin);
    plan.entries.push({ kind: 'copy', sourceOffset: begin, length: end - begin, targetOffset });
  }

  static _addLayer(plan, name, tensor) {
    const [rows, columns] = tensor.shape;
    const module = Int8ConvrotPlan._moduleOf(name);
    const config = Int8ConvrotPlan.quantConfigBytes();
    const [begin, end] = tensor.data_offsets;
    const codesOffset = Int8ConvrotPlan._place(plan, name, 'I8', [rows, columns], rows * columns);
    const scalesOffset = Int8ConvrotPlan._place(plan, `${module}.weight_scale`, 'F32', [rows, 1], rows * 4);
    const configOffset = Int8ConvrotPlan._place(plan, `${module}.comfy_quant`, 'U8', [config.length], config.length);
    plan.entries.push({
      kind: 'layer', name, dtype: tensor.dtype, rows, columns, sourceOffset: begin, length: end - begin, codesOffset, scalesOffset,
    });
    plan.entries.push({ kind: 'bytes', bytes: config, targetOffset: configOffset });
    plan.layers += 1;
  }

  static _place(plan, name, dtype, shape, length) {
    const offset = plan.dataBytes;
    plan.header[name] = { dtype, shape, data_offsets: [offset, offset + length] };
    plan.dataBytes += length;
    return offset;
  }

  static _moduleOf(name) {
    return name.slice(0, -Int8ConvrotPlan.WEIGHT_SUFFIX.length);
  }
}

module.exports = Int8ConvrotPlan;
