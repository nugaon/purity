const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'purity',
  {
    sendTransaction: (id, to, value = "0", data = undefined) => ipcRenderer.send('open-send-transaction-popup', { popupId: id, to, value, data })
  }
)
