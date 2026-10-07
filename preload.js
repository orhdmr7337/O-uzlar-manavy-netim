const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('data:load'),
  save: data => ipcRenderer.invoke('data:save', data),
  openDataFolder: () => ipcRenderer.invoke('data:openFolder'),
  exportJson: (name, data) => ipcRenderer.invoke('file:exportJson', { name, data }),
  importJson: () => ipcRenderer.invoke('file:importJson'),
  printers: () => ipcRenderer.invoke('print:printers'),
  print: opts => ipcRenderer.invoke('print:print', opts),
  pdf: opts => ipcRenderer.invoke('print:pdf', opts)
});
