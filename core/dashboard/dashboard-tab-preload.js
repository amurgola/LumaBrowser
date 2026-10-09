const { contextBridge, ipcRenderer } = require('electron');
const DashboardPreloadApi = require('./preload/DashboardPreloadApi');

DashboardPreloadApi.expose(contextBridge, ipcRenderer);
