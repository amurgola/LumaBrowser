const AutoPlanner = require('../../llm-server/models/AutoPlanner');
const CuratedModelCatalog = require('../../llm-server/models/CuratedModelCatalog');
const HwBudget = require('../../llm-server/models/HwBudget');
const ImageModelCatalog = require('../../image-server/models/ImageModelCatalog');
const ImageModelPicker = require('../../shared/ImageModelPicker');
const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');
const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PreviewRigs = require('./PreviewRigs');

class PlacementPreview {
  constructor({ planner = new AutoPlanner(), llmModels = CuratedModelCatalog.MODELS, imageModels = () => new ImageModelCatalog().list() } = {}) {
    this._planner = planner;
    this._llmModels = llmModels;
    this._imageModels = imageModels;
  }

  describe(rigId) {
    const rig = PreviewRigs.byId(rigId);
    if (!rig) return null;
    const diagnostics = PreviewRigs.diagnostics(rig);
    const devices = CudaDeviceProbe.readDevices(diagnostics);
    const plan = this._plan(diagnostics, devices);
    return {
      rig: { id: rig.id, label: rig.label },
      summary: plan.summary,
      snapshot: PlacementPreview._snapshot(devices, plan),
      config: { layout: PlacementPreview._layout(devices, plan), measuredCurrent: PlacementPreview._estimates(plan), canApply: false },
    };
  }

  _plan(diagnostics, devices) {
    return this._planner.plan({
      hw: HwBudget.build(diagnostics),
      devices,
      wantImage: true,
      wantMusic: false,
      llmModels: this._llmModels,
      imageModels: this._imageModels(),
    });
  }

  static _snapshot(devices, plan) {
    const servers = {};
    for (const item of PlacementLayout.ITEM_KEYS) servers[item] = PlacementPreview._slot(null);
    if (plan.llm) servers.llm = PlacementPreview._slot(`${plan.llm.label} ${plan.llm.quant}`);
    if (plan.image) servers.imageGenerate = PlacementPreview._slot(plan.image.label);
    return { devices, remoteDevices: [], servers };
  }

  static _slot(modelId) {
    return { modelId, available: modelId != null, state: 'idle', devices: [], offloadToCpu: false };
  }

  static _layout(devices, plan) {
    if (plan.placement.layout) return plan.placement.layout;
    const layout = PlacementLayout.emptyLayout();
    if (!devices.length) return layout;
    const card = PlacementLayout.gpuResourceId(devices[0].index);
    layout.resources.push({ id: card, kind: 'gpu', devices: [devices[0].index] });
    if (plan.llm) layout.items.llm = PlacementPreview._pin(plan.llm.mode === 'cpu' ? PlacementLayout.RAM_ID : card);
    if (plan.image) layout.items.imageGenerate = PlacementPreview._pin(PlacementPreview._imageStreams(plan) ? PlacementLayout.RAM_ID : card);
    return layout;
  }

  static _imageStreams(plan) {
    return plan.placement.kind === 'fcfs' || !!plan.image.offload;
  }

  static _pin(resource) {
    return { resource, split: null };
  }

  static _estimates(plan) {
    const estimates = {};
    if (plan.llm && plan.llm.vramNeedBytes != null) estimates.llm = { peakVramBytes: plan.llm.vramNeedBytes };
    if (plan.image) estimates.imageGenerate = { peakVramBytes: plan.image.minVramBytes + ImageModelPicker.IMAGE_HEADROOM };
    return estimates;
  }
}

module.exports = PlacementPreview;
