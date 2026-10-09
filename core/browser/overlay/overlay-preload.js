const { contextBridge, ipcRenderer } = require('electron');
const OverlayPreloadApi = require('./OverlayPreloadApi');

OverlayPreloadApi.expose(contextBridge, ipcRenderer);
