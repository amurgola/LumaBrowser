import SetupMain from '../setup-ui/SetupMain.js';
import ImageSetupPanel from '../image-setup/ImageSetupPanel.js';
import MusicSetupPanel from '../music-setup/MusicSetupPanel.js';
import GroundingSetupCard from '../grounding-setup/GroundingSetupCard.js';
import ModelList from '../models/ModelList.js';
import ModelSearch from '../models/ModelSearch.js';
import EasySetupWizard from '../wizard/EasySetupWizard.js';

export default class SetupWiring {
  constructor({ api, chatExt = null, doc = document, win = window }) {
    this._api = api;
    this._chatExt = chatExt;
    this._doc = doc;
    this._win = win;
    this.setupMain = null;
  }

  build() {
    const getApi = () => this._api;
    this.imageSetup = new ImageSetupPanel({ getApi, modelList: ModelList });
    this.musicSetup = new MusicSetupPanel({ getApi, getChatExt: () => this._chatExt });
    this.modelSearch = new ModelSearch({ getApi });
    this.grounding = new GroundingSetupCard({ getApi });
    this.wizard = new EasySetupWizard({ getApi });
    this.setupMain = this._buildSetupMain();
    return this;
  }

  start() {
    this.setupMain.start();
    this.musicSetup.hideNavIfUnsupported();
    this.grounding.start();
    this.wizard.install();
  }

  get navigator() {
    return this.setupMain.navigator;
  }

  _buildSetupMain() {
    return new SetupMain({
      api: this._api,
      doc: this._doc,
      win: this._win,
      modelList: ModelList,
      modelSearch: this.modelSearch,
      openers: { image: () => this.imageSetup.open(), music: () => this.musicSetup.open() },
    });
  }
}
