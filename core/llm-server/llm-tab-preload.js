const { contextBridge, ipcRenderer, webUtils } = require('electron');
const LlmTabPreloadApi = require('./preload/LlmTabPreloadApi');

LlmTabPreloadApi.expose(contextBridge, ipcRenderer, webUtils);
