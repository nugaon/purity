import Papa from "papaparse";
import { Encrypted } from "eth-crypto";
import { EncryptionKeyService } from "./EncryptionKeyService";
import { SubscriberData } from "../contracts/ContentChannel";
import { ReactNotificationHandler } from '../services/notifications';
import { StorageService } from "./StorageService";

export class PremiumContentService {
  public static async revealRealContentAddress(secretContentAddress: string, userAddress: string): Promise<string> {
    const encryptionKeyService = new EncryptionKeyService(userAddress);
    return new Promise<string>((resolve, reject) => {
      let foundAddress = false;
      Papa.parse(secretContentAddress, {
      	download: true,
        delimiter: "~",
        step: (row, parser) => {
          if(row.data[0] === userAddress) {
            const encryptedData: Encrypted = JSON.parse(row.data[1]);
            console.log("yess", encryptedData);
            resolve(encryptionKeyService.decryptEncryptedData(encryptedData));
            foundAddress = true;
            parser.abort();
          }
      	},
      	complete: () => {
          if(!foundAddress) {
            ReactNotificationHandler.addNotification({
              title: "Premium content",
              message: `You weren't Premium User on the Channel, when the content has been uploaded.`,
            });
            console.log("Your address has not found.");
          }
      	}
      });
    });
  }

  /// Returns in csv data string format the encrypted data for all given subscribers;
  public static async hideRealContentAddress(subscribers: Array<SubscriberData>, realContentAddress: string): Promise<string> {
    // Encrypt with the uploader's key first.
    const encryptedDataTable: Array<Array<string>> = [];
    const uploaderAddress = StorageService.getClientAddress();
    const uploaderKeyService = new EncryptionKeyService(uploaderAddress);
    const encryptedData = await EncryptionKeyService.encryptData(uploaderKeyService.getDecompressedPubKey(), realContentAddress);
    encryptedDataTable.push([
      uploaderAddress,
      JSON.stringify(encryptedData)
    ]);

    //upload with the subscribers' keys too.
    for (const subscriber of subscribers) {
      const encryptedData = await EncryptionKeyService.encryptData(subscriber.decompressedPubKey, realContentAddress);
      encryptedDataTable.push([
        subscriber.address.toLowerCase(),
        JSON.stringify(encryptedData)
      ]);
    }

    //return CSV file which contains all encrypted endpoints with addresses.
    return Papa.unparse(encryptedDataTable,
      {
      	delimiter: "~",
      }
    );
  }

}
