const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const brewService = require('./services/brewService');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#312E28',
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.icns'),
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set dock icon on macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(__dirname, '..', 'assets', 'icons', 'icon_512x512.png'));
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers for Homebrew operations

// Get Homebrew info
ipcMain.handle('brew:info', async () => {
  return await brewService.getBrewInfo();
});

// List installed packages
ipcMain.handle('brew:list', async (event, type) => {
  return await brewService.listInstalled(type);
});

// Search packages
ipcMain.handle('brew:search', async (event, query) => {
  return await brewService.search(query);
});

// Get package info
ipcMain.handle('brew:package-info', async (event, name, isCask) => {
  return await brewService.getPackageInfo(name, isCask);
});

// Install package
ipcMain.handle('brew:install', async (event, name, isCask) => {
  return await brewService.install(name, isCask);
});

// Uninstall package
ipcMain.handle('brew:uninstall', async (event, name, isCask) => {
  return await brewService.uninstall(name, isCask);
});

// Update Homebrew
ipcMain.handle('brew:update', async () => {
  return await brewService.update();
});

// Upgrade packages
ipcMain.handle('brew:upgrade', async (event, name, isCask) => {
  return await brewService.upgrade(name, isCask);
});

// Get outdated packages
ipcMain.handle('brew:outdated', async () => {
  return await brewService.getOutdated();
});

// Cleanup
ipcMain.handle('brew:cleanup', async (event, dryRun) => {
  return await brewService.cleanup(dryRun);
});

// Doctor
ipcMain.handle('brew:doctor', async () => {
  return await brewService.doctor();
});

// Get services
ipcMain.handle('brew:services', async () => {
  return await brewService.getServices();
});

// Start service
ipcMain.handle('brew:service-start', async (event, name) => {
  return await brewService.startService(name);
});

// Stop service
ipcMain.handle('brew:service-stop', async (event, name) => {
  return await brewService.stopService(name);
});

// Restart service
ipcMain.handle('brew:service-restart', async (event, name) => {
  return await brewService.restartService(name);
});

// Add tap
ipcMain.handle('brew:tap-add', async (event, name) => {
  return await brewService.addTap(name);
});

// Remove tap
ipcMain.handle('brew:tap-remove', async (event, name) => {
  return await brewService.removeTap(name);
});

// List taps
ipcMain.handle('brew:taps', async () => {
  return await brewService.listTaps();
});

// Pin package
ipcMain.handle('brew:pin', async (event, name) => {
  return await brewService.pin(name);
});

// Unpin package
ipcMain.handle('brew:unpin', async (event, name) => {
  return await brewService.unpin(name);
});

// Get pinned packages
ipcMain.handle('brew:pinned', async () => {
  return await brewService.getPinned();
});

// Get dependencies
ipcMain.handle('brew:deps', async (event, name) => {
  return await brewService.getDependencies(name);
});

// Get dependents (uses)
ipcMain.handle('brew:uses', async (event, name) => {
  return await brewService.getUses(name);
});

// Run custom command
ipcMain.handle('brew:custom', async (event, args) => {
  return await brewService.runCustomCommand(args);
});

// Open external link
ipcMain.handle('shell:open-external', async (event, url) => {
  await shell.openExternal(url);
});

// Show message dialog
ipcMain.handle('dialog:message', async (event, options) => {
  return await dialog.showMessageBox(mainWindow, options);
});

// Check if Homebrew is installed
ipcMain.handle('brew:check', async () => {
  return await brewService.checkHomebrew();
});

// Get config
ipcMain.handle('brew:config', async () => {
  return await brewService.getConfig();
});

// Autoremove unused dependencies
ipcMain.handle('brew:autoremove', async () => {
  return await brewService.autoremove();
});

// Get leaves (packages not depended on by others)
ipcMain.handle('brew:leaves', async () => {
  return await brewService.getLeaves();
});
