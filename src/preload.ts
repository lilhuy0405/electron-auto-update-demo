// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer } from "electron"


ipcRenderer.invoke('get-app-info').then((result) => {
  console.log("get-app-info", result)
})
// console.log(result)