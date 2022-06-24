'use strict'

import { app, protocol, BrowserWindow, dialog, ipcMain } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
const isDevelopment = process.env.NODE_ENV !== 'production';

import path from 'path';

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
]);

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 500,
    height: 500,
    // width: 800,
    // height: 600,
    webPreferences: {
      
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      // devTools: false
    },
    // frame: false,
    // resizable: false
  })

  win.setMenu(null);

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e: any) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('open-folder', (evt, arg) => {
  dialog.showOpenDialog({
    title: arg[0],
    // defaultPath: 'D:\\',
    properties: ['openDirectory']
  }).then(res => {
    if(!res.canceled){
      evt.sender.send(arg[1], res.filePaths[0]);
    }
  });  
});

ipcMain.on('open-file', (evt, arg) => {
  dialog.showOpenDialog({
    title: arg[0],
    // defaultPath: 'D:\\',
    properties: ['openFile']
  }).then(res => {
    if(!res.canceled){
      evt.sender.send(arg[1], res.filePaths[0]);
    }
  });  
});

ipcMain.on('binary-path', (evt, arg) => {
  const binaryPath = !isDevelopment && app.isPackaged
    ? path.join(path.dirname(app.getAppPath()), './bin')
    : path.join(process.cwd(), './src', './resources', './bin');

  evt.sender.send('binary-path', binaryPath);
});

ipcMain.on('exit-now', (evt, arg) => {
  app.exit();
});