const { contextBridge, ipcRenderer } = require('electron');
const OnDemandPreloadApi = require('./preload/OnDemandPreloadApi');

OnDemandPreloadApi.expose(contextBridge, ipcRenderer);
