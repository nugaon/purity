import EthCrypto, { Encrypted } from "eth-crypto";
import { default as store } from 'store';

type identityType = {
    privateKey: string,
    publicKey: string,
    address: string
}

/// Used for Premium Content's encryption/decription
export class EncryptionKeyService {

  private userAddress: string;
  private identity: identityType;
  private storageKey: string; //the key of the storage where the identity is stored.

  constructor(userAddress: string) {
    this.storageKey = "encryptionKeys";
    this.userAddress = userAddress.toLowerCase();
    const identityStore = store.get(this.storageKey);

    if(identityStore === undefined || identityStore[this.userAddress] === undefined) {
      this.identity = this.generateAssymetricKeyPair();
    } else {
      this.identity = store.get(this.storageKey)[this.userAddress];
    }
  }

  public static async encryptData(userPubKey: string, data: string): Promise<Encrypted> {
    return EthCrypto.encryptWithPublicKey(
      userPubKey, // publicKey
      data // message
    );
  }

  public async decryptEncryptedData(encryptedData: Encrypted): Promise<string> {
    return EthCrypto.decryptWithPrivateKey(this.identity.privateKey, encryptedData);
  }

  public getCompressedPubKey(): string {
    return EthCrypto.publicKey.compress(this.identity.publicKey);
  }

  public getDecompressedPubKey(): string {
    return this.identity.publicKey;
  }

  private generateAssymetricKeyPair(): identityType {
    const identity = EthCrypto.createIdentity();
    let identityStore = store.get(this.storageKey) ? store.get(this.storageKey) : {};
    identityStore[this.userAddress] = identity;
    store.set(this.storageKey, identityStore);
    //not necessary await
    //this.purityWeb.setUserPubKey(EthCrypto.publicKey.compress(identity.publicKey));
    return identity;
  }
}
