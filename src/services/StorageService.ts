import { ContentChannelData, PageSection } from "../IApp";
import { default as ContentChannel } from "../contracts/ContentChannel";
import { SubscriberData } from "../contracts/ContentChannel";
import { default as store } from 'store';
import { Environment } from "../environments/Environment";

export class StorageService {

  public static saveLastBlock(blockNumber: number | "latest") {
    const userAddress = store.get("clientAddress");
    let lastBlock = store.get("lastBlock");
    if(!lastBlock) {
      lastBlock = {};
    }
    lastBlock[userAddress] = blockNumber;

    store.set("lastBlock", lastBlock);
  }

  public static getLastBlock(): number | "latest" {
    const userAddress = store.get("clientAddress");
    const lastBlock = store.get("lastBlock");
    return lastBlock && lastBlock[userAddress] ? lastBlock[userAddress] : "latest";
  }

  // OwnedChannel Functions
  public static getUserOwnedChannels(): {[channelName: string]: ContentChannelData} {
    const userAddress = store.get("clientAddress");
    const userOwnedChannels = store.get("ownedChannels")[userAddress];
    const ownedChannels: {[channelName: string]: ContentChannelData} = userOwnedChannels ? userOwnedChannels : {};
    return ownedChannels;
  }

  public static setIpfsConnection(
    host: string,
    port: number,
    protocol: "http" | "https"
  ) {
    store.set("ipfsConnection", {host, port, protocol});
  }

  public static getIpfsConnection(): {
    host: string,
    port: number,
    protocol: "http" | "https"
  } {
    return store.get("ipfsConnection");
  }

  public static async saveUserOwnedChannel(newChannel: ContentChannel, subscribers: Array<SubscriberData> = []) {
    const userAddress = store.get("clientAddress");
    const ownedChannels = store.get("ownedChannels");
    let userOwnedChannels = StorageService.getUserOwnedChannels();
    userOwnedChannels[newChannel.channelName] = await this.getContentChannelStorageData(newChannel);
    userOwnedChannels[newChannel.channelName]["subscribers"] = subscribers;
    let userObject = {};
    userObject[userAddress] = userOwnedChannels;
    store.set('ownedChannels', Object.assign(ownedChannels, userObject));
  }

  public static async getContentChannelStorageData(contentChannel: ContentChannel): Promise<ContentChannelData> {
    if (!contentChannel.asyncInited) {
      await contentChannel.initContract();
    }

    const contentChannelStorageData: ContentChannelData = {
      owner: contentChannel.contentCreator,
      contentChannelAddress: contentChannel.contractAddress,
      channelName: contentChannel.channelName
    };

    return contentChannelStorageData;
  }

  // SubscriptionChannels functions

  public static getUserSubscribedChannels(): {[channelName: string]: ContentChannelData} {
    const userAddress = store.get("clientAddress");
    const userSubscribedChannels = store.get("subscriptions")[userAddress];
    const subscribedChannels: {[channelName: string]: ContentChannelData} = userSubscribedChannels ? userSubscribedChannels : {};
    return subscribedChannels;
  }

  public static async saveUserSubscribedChannel(newChannel: ContentChannel) {
    const userAddress = store.get("clientAddress");
    const subscriptions = store.get("subscriptions");
    const userSubscriptions = subscriptions[userAddress] ? subscriptions[userAddress] : {};
    if(userSubscriptions[newChannel.channelName] === undefined) {
      userSubscriptions[newChannel.channelName] = await this.getContentChannelStorageData(newChannel);
      subscriptions[userAddress] = userSubscriptions;
      store.set('subscriptions', subscriptions);
    }
  }

  public static getClientAddress(): string {
    return store.get("clientAddress");
  }

  public static setClientAddress(address: string) {
    return store.set("clientAddress", address.toLowerCase());
  }

  public static getIpfsGateway(): string {
    return store.get("ipfsGateway") ? store.get("ipfsGateway") : Environment.defaultValues.ipfsGateway;
  }

  public static setIpfsGateway(gateway: string) {
    return store.set("ipfsGateway", gateway);
  }

  public static saveNotificationCounts(section: PageSection, count: number) {
    let myEvents = store.get(section + "Events");
    const address = this.getClientAddress();
    if(!myEvents) {
      myEvents = {};
    }
    if(!myEvents[address]) {
      myEvents[address] = {};
    }
    myEvents[address]["notificationCount"] = count;
    store.set(section + "Events", myEvents);
  }

  public static getNotificationCounts(section: PageSection): number {
    const address = this.getClientAddress();
    const events = store.get(section + "Events");
    if(events && events[address]) {
      return events[address].notificationCount;
    } else {
      return 0;
    }
  }

  public static saveOwnedChannelsEvents(events: any) {
    let myEvents = store.get("ownedChannelsEvents");
    const address = this.getClientAddress();
    if(!myEvents) {
      myEvents = {};
    }
    myEvents[address] = events;
    store.set("ownedChannelsEvents", myEvents);
  }

  //get current users events
  public static getOwnedChannelEvents() {
    const address = this.getClientAddress();
    const events = store.get("ownedChannelsEvents");
    if(events && events[address]) {
      return events[address];
    } else {
      return {
        newSubsriptions: {}
      };
    }
  }

  public static saveMySubscriptionEvents(events: any) {
    let myEvents = store.get("subscriptionsEvents");
    const address = this.getClientAddress();
    if(!myEvents) {
      myEvents = {};
    }
    myEvents[address] = events;
    store.set("subscriptionsEvents", myEvents);
  }

  public static getMySubscriptionEvents() {
    const address = this.getClientAddress();
    const events = store.get("subscriptionsEvents");
    if(events && events[address]) {
      return events[address];
    } else {
      return {
        contentUpload: {}
      };
    }
  }

  public static getGasLimit(): number {
    return Environment.defaultValues.web3Gas;
  }

  public static getGasPrice(): string {
    return Environment.defaultValues.web3GasPrice;
  }

  public static getWeb3ConnectionString(): string {
    return store.get('web3ConnectionString') ? store.get('web3ConnectionString') : Environment.defaultValues.web3ConnectionString;
  }

  public static setWeb3ConnectionString(connection: string) {
    store.set("web3ConnectionString", connection);
  }

  public static setWeb3ConnectionType(connection: "direct" | "metamask") {
    store.set("web3ConnectionType", connection);
  }

  public static getWeb3ConnectionType(): "direct" | "metamask" | null {
    return store.get("web3ConnectionType") ? store.get('web3ConnectionType') : null;
  }

  public static setAccountPassword(account: string, password: string) {
    store.set("accountPassword", {[account]: password});
    window.sessionStorage.setItem("accountPassword", JSON.stringify({[account]: password}))
  }

  /// Only one account can be logged in at once.
  public static getAccountPassword(): {[account: string]: string} | undefined {
    const accountPassword = store.get("accountPassword");
    if(accountPassword === undefined) {
      const accountPasswordInSession: string | null
        = window.sessionStorage.getItem("accountPassword")
      if(!accountPasswordInSession) {
        return undefined
      } else {
        //set from sessionStorage to localStorage if it presents
        const accountPasswordObject: {[account: string]: string} 
          = JSON.parse(accountPasswordInSession)
        const account = Object.keys(accountPasswordObject)[0]
        StorageService.setAccountPassword(account, accountPasswordObject[account])
        return accountPasswordObject
      }
    }
    return accountPassword
  }

  public static deleteAccountPasswords() {
    store.set("accountPassword", undefined);
  }
}
