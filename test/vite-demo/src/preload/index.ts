import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  openNewWindow: () => ipcRenderer.send('open-new-window')
}) 