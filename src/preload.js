const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('brew', {
  // System
  check: () => ipcRenderer.invoke('brew:check'),
  info: () => ipcRenderer.invoke('brew:info'),
  config: () => ipcRenderer.invoke('brew:config'),

  // Package management
  list: (type) => ipcRenderer.invoke('brew:list', type),
  search: (query) => ipcRenderer.invoke('brew:search', query),
  packageInfo: (name, isCask) => ipcRenderer.invoke('brew:package-info', name, isCask),
  install: (name, isCask) => ipcRenderer.invoke('brew:install', name, isCask),
  uninstall: (name, isCask) => ipcRenderer.invoke('brew:uninstall', name, isCask),

  // Updates
  update: () => ipcRenderer.invoke('brew:update'),
  upgrade: (name, isCask) => ipcRenderer.invoke('brew:upgrade', name, isCask),
  outdated: () => ipcRenderer.invoke('brew:outdated'),

  // Maintenance
  cleanup: (dryRun) => ipcRenderer.invoke('brew:cleanup', dryRun),
  doctor: () => ipcRenderer.invoke('brew:doctor'),
  autoremove: () => ipcRenderer.invoke('brew:autoremove'),
  leaves: () => ipcRenderer.invoke('brew:leaves'),

  // Services
  services: () => ipcRenderer.invoke('brew:services'),
  serviceStart: (name) => ipcRenderer.invoke('brew:service-start', name),
  serviceStop: (name) => ipcRenderer.invoke('brew:service-stop', name),
  serviceRestart: (name) => ipcRenderer.invoke('brew:service-restart', name),

  // Taps
  taps: () => ipcRenderer.invoke('brew:taps'),
  tapAdd: (name) => ipcRenderer.invoke('brew:tap-add', name),
  tapRemove: (name) => ipcRenderer.invoke('brew:tap-remove', name),

  // Pinning
  pin: (name) => ipcRenderer.invoke('brew:pin', name),
  unpin: (name) => ipcRenderer.invoke('brew:unpin', name),
  pinned: () => ipcRenderer.invoke('brew:pinned'),

  // Dependencies
  deps: (name) => ipcRenderer.invoke('brew:deps', name),
  uses: (name) => ipcRenderer.invoke('brew:uses', name),

  // Custom command
  custom: (args) => ipcRenderer.invoke('brew:custom', args)
});

// Expose shell and dialog utilities
contextBridge.exposeInMainWorld('shell', {
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
});

contextBridge.exposeInMainWorld('dialog', {
  message: (options) => ipcRenderer.invoke('dialog:message', options)
});
