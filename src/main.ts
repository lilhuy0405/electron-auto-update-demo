import { app, BrowserWindow, autoUpdater, dialog, ipcMain } from 'electron';
import path from 'path';
import si from 'systeminformation';
console.log(`is app packaged: ${app.isPackaged}`);
console.log(`app version: ${app.getVersion()}`);
console.log(`platform: ${process.platform}`);
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const server = 'http://192.168.90.25:8080'
const getPlatform = () => {
  const processPlatform = process.platform
  if (processPlatform === 'darwin') return 'osx_64'
  if (processPlatform.includes('win')) return 'windows_64'
  if (processPlatform.includes('linux')) return 'linux_64'

}
const url = `${server}/update/${getPlatform()}/${app.getVersion()}`
if (app.isPackaged) {
  //only check for auto updates if the app is packaged
  console.log(`update url: ${url}`)
  autoUpdater.setFeedURL({ url })
  //check for updates
  setInterval(() => {
    // console.log('checking for updates')
    autoUpdater.checkForUpdates()
  }, 1000 * 60) //every 1 second

  //notify user when update is available
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    console.log('A new update is ready to install', `Version ${releaseName} is downloaded and will be automatically installed on Quit`)
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', (message) => {
    console.error('There was a problem updating the application')
    console.error(message)
  })
}

//send app version to renderer
ipcMain.handle('get-app-info', async (event, ...args) => {
  const systemInf = await si.osInfo();
  return {
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged,
    updaterUrl: url,
    systemInf

  }
})
