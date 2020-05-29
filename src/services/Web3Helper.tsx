import { ExtendedWeb3Client } from "../IApp";
import { ipcRenderer } from "electron";

export class Web3Helper {
  private web3: ExtendedWeb3Client;

  constructor(web3: ExtendedWeb3Client) {
    this.web3 = web3;
  }

  /// Get connected ethereum net type
  async getConnectionType(): Promise<'main'  | 'test' | undefined> {
    const id = await this.web3.client.eth.net.getId();
    switch(id) {
      case 1:
        return 'main';
      case 4:
        return 'test';
      default:
        return undefined
    }
  }

  async getTransactionId(popupId: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const listener = (e, args) => {
        const { popupId, txId } = args
        if(popupId === popupId) {
          ipcRenderer.removeListener('result-sendtransaction-popup', listener)
          if(args['result'] === 'success') {
            resolve(txId)
          } else {
            reject("The user cancelled the send transaction modal.")
          }
        }
      }
      ipcRenderer.on('result-sendtransaction-popup', listener)
    })
  }

  async sendTransaction(
    popupId: string,
    to?: string,
    value?: string,
    data?: string,
  ): Promise<string> {
    ipcRenderer.send('open-send-transaction-popup', { popupId, to, value, data });
    return this.getTransactionId(popupId)
  }

  async waitForTransactionSuccess(txId: string, confirmationNumber = 1): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        const txReceipt = await this.web3.client.eth.getTransactionReceipt(txId);
        const currentBlock = await this.web3.client.eth.getBlockNumber()
        if(txReceipt && txReceipt.status && txReceipt.blockNumber + confirmationNumber >= currentBlock){
          clearInterval(interval);
          resolve()
        } else if(txReceipt && txReceipt.status) {
          clearInterval(interval);
          reject('Transaction has been rejected by the network\'s EVMs.')
        }
      }, 5 * 1000)
    })
  }
}
