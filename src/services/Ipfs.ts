import { Environment } from "../environments/Environment";
import { StorageService } from "./StorageService";
import { ipcRenderer } from "electron";

export class IpfsClient {

  constructor() { }

  /// Returns hash ID
  async add(filePath: string): Promise<string> {
    const requestId = "1"
    ipcRenderer.send('add-ipfs-file', { id: requestId, filePath });

    return new Promise<string>((resolve, reject) => {
      const resultEventName = 'result-add-ipfs-file'
      const listener = (e, args) => {
        const { result, id, successful } = args
        console.log("addGet", args)
        if(requestId === id) {
          ipcRenderer.removeListener(resultEventName, listener)
          if(successful) {
            resolve(result['hash'])
          } else {
            reject(result)
          }
        }
      }
      ipcRenderer.on(resultEventName, listener)
    })
  }

  /// Returns folder hash ID
  async addFolder(path: string, ): Promise<string> {
    const requestId = "1"
    ipcRenderer.send('add-ipfs-folder', { id: requestId, path });

    return new Promise<string>((resolve, reject) => {
      const resultEventName = 'result-add-ipfs-folder'
      const listener = (e, args) => {
        const { result, id, successful } = args
        console.log("addGetFolder", args)
        if(requestId === id) {
          ipcRenderer.removeListener(resultEventName, listener)
          if(successful) {
            resolve(result[result.length - 1]['hash'])
          } else {
            reject(result)
          }
        }
      }
      ipcRenderer.on(resultEventName, listener)
    })
  }

  /// Publish the given CID with the given 'key'
  async publishHash(hash: string, key: string): Promise<string> {
    const requestId = `publishHash-${hash}`
    ipcRenderer.send('publish-ipfs-hash', { id: requestId, hash, key });

    return new Promise<string>((resolve, reject) => {
      const resultEventName = 'result-publish-ipfs-hash'
      const listener = (e, args) => {
        const { result, id, successful } = args
        console.log("result publishIpfsHash", args)
        if(requestId === id) {
          ipcRenderer.removeListener(resultEventName, listener)
          if(successful) {
            resolve(result)
          } else {
            reject(result)
          }
        }
      }
      ipcRenderer.on(resultEventName, listener)
    })
  }

  /// Returns string hash ID
  async addString(filename: string, value: string): Promise<string> {
    const requestId = "1"
    ipcRenderer.send('add-ipfs-string', { id: requestId, value, filename });

    return new Promise<string>((resolve, reject) => {
      const resultEventName = 'result-add-ipfs-string'
      const listener = (e, args) => {
        const { result, id, successful } = args
        console.log("addStringGet", args)
        if(requestId === id) {
          ipcRenderer.removeListener(resultEventName, listener)
          if(successful) {
            resolve(result['hash'])
          } else {
            reject(result)
          }
        }
      }
      ipcRenderer.on(resultEventName, listener)
    })
  }
}


interface IpfsClientOptions {
  host?: string;
  port?: string;
  protocol?: 'http';
  'api-path'?: string;
  headers?: any;
}
