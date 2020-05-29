import contractAbi from "./abis/ContentChannel";
import { ReactNotificationHandler } from '../services/notifications';
import { default as PurityWeb } from "./PurityWeb";
import { initPurityWebInstance } from "../services/initPurityWebInstance";
import { ExtendedWeb3Client, ContentChannelData, ContentType, Content, FileProtocol } from "../IApp";
import { EncryptionKeyService } from "../services/EncryptionKeyService";
import { TransactionReceipt } from "web3-core";
import { Contract } from "web3-eth-contract";
import { default as store } from 'store';
import { castCompressedPubKeyFromContractStore, castPubKeyPrefixToBoolean } from "./helpers/PubKeyCast";
import EthCrypto from "eth-crypto";
import { Web3Helper } from "../services/Web3Helper";

interface Props {
  web3: ExtendedWeb3Client;
  contractAddress: string;
  // initContract method fills or opt.
  contentCreator?: string;
  channelName?: string;
}

// SUBSCRIPTIONS
export interface SubscriberKeys {
  pubKeyPrefix: boolean;
  pubKey: string;
}

export interface SubscriberData {
  address: string;
  decompressedPubKey: string;
}

class ContentChannel {

  public contractAddress: string;
  public channelName: string;
  public description: string;
  public asyncInited: boolean;
  public contentCreator: string;
  public channelId: number;
  protected web3: ExtendedWeb3Client;
  protected contract: Contract;
  private activeEvents: Array<any>;
  //SUBSCRIPTIONS
  public price: string | undefined;
  public balance: string;
  public period: number | undefined; //how many seconds the user get after subscription
  public subscribers: Array<SubscriberData>;
  public subscriptionCount: number;
  private userSubTime: number | null; //user's premium subscription deadline -> timestamp in seconds -> only called through getter function.
  private purityWeb: PurityWeb;
  //FILEUPLOADS
  public hasContentFetchMore: boolean;
  private activeContentLabel: string;
  private contentLabelIndexes: {[label: string]: Array<number>};
  private contentLabels: Array<string>;
  private subscriberContents: Array<Content>;
  private fetchContentPageSize: number;
  private nextFetchContentsPage: number;

  constructor(props: Props) {
    this.web3 = props.web3;
    this.contractAddress = props.contractAddress;
    this.contract = new this.web3.client.eth.Contract(contractAbi, this.contractAddress);
    // if all of the data passed to the constructor not necessary to call initContract method
    this.purityWeb = initPurityWebInstance(this.web3);
    this.activeEvents = [];
    //SUBSCRIPTIONS
    this.balance = "0";
    this.subscribers = [];
    //FILEUPLOADS
    this.fetchContentPageSize = 1;
    this.nextFetchContentsPage = 0;
    this.hasContentFetchMore = true;
    this.subscriberContents = [];
    this.contentLabels = ["All"]; //Every Contract has this label
    this.activeContentLabel = "All";
    this.contentLabelIndexes = {};
    if(
      typeof props.contentCreator === "string"
      && typeof props.channelName === "string"
    ) {
      this.contentCreator = props.contentCreator;
      this.channelName = props.channelName;
      this.asyncInited = true;
    }
  }

  public async fetchDescription() {
    const description = this.contract.methods.description();
    this.description = await description.call(this.web3.transactionOptions);
  }

  async setDescription(description: string): Promise<string> {
    const data = this.contract.methods.setDescription(description).encodeABI()
    const popupId = `setDescription-${this.channelName}`
    const web3Helper = new Web3Helper(this.web3)
    return web3Helper.sendTransaction(popupId, this.contractAddress, "0", data)
  }

  async initContract() {
    const contractData = await this.getContentChannelData();
    console.log("contractData", contractData);
    this.contentCreator = contractData.contentCreator_;
    this.channelName = contractData.channelName_;
    this.channelId = contractData.channelId_;
    this.balance = contractData.balance_;
    this.price = contractData.price_;
    this.subscriptionCount = contractData.subscriptionCount_;
    this.userSubTime = contractData.userSubTime_;
    this.description = contractData.description_;

    this.asyncInited = true;
  }

  // Especially used at init
  private async getContentChannelData(): Promise<{
    contentCreator_: string,
    channelName_: string,
    description_: string,
    channelId_: number,
    balance_: string,
    price_: string,
    subscriptionCount_: number, //listing according the subscription count in the topic.
    userSubTime_: number,
  }> {
    let response: any = await this.contract.methods.getChannelData().call(this.web3.transactionOptions);
    response.channelName_ = this.web3.client.utils.hexToUtf8(response.channelName_);
    response.balance_ = this.web3.client.utils.fromWei(response.balance_);
    response.price_ = this.web3.client.utils.fromWei(response.price_);
    return response;
  }

  async subscribeForSubscriptionHappened(onSubscriptionHappened: Function) {
    console.log("sub for SubscriptionHappened event", this.contractAddress);
    this.activeEvents.push(this.contract.events.SubscriptionHappened({
      fromBlock: this.web3.lastBlockNumber,
    }, (error, event) => {
      if (error) {
        console.log(`Error at contract event listening: ${error}`);
      }
      onSubscriptionHappened(this);
      console.log("subscription happened", event);
    }));
  }

  getOwnedChannelFromStorage(): ContentChannelData {
    return store.get("ownedChannels")[this.web3.transactionOptions.from][this.channelName];
  }

  async fetchChannelId() {
      this.channelId = await this.contract.methods.channelId().call(this.web3.transactionOptions);
  }

  /// SUBSCRIPTIONS

  async fetchSubscriptionCount() {
    this.subscriptionCount = await this.contract.methods.getSubscriptionCount().call(this.web3.transactionOptions);
  }

  async fetchPeriodTime() {
    let period = this.contract.methods.period();
    this.period = await period.call(this.web3.transactionOptions);
  }

  async fetchUserSubTime() {
    try {
      this.userSubTime = await this.contract.methods.premiumDeadlines(this.web3.transactionOptions.from).call(this.web3.transactionOptions);
    } catch(e) {
      console.log("fetchUserSubTime", e);
      this.userSubTime = null;
    }
  }

  /// @dev Only necessary to call at Channels initialization which the user subscribed on.
  /// @return userSubTime in a correct timestamp format OR the current date
  getUserSubTime(): number {
    return this.userSubTime ? this.userSubTime * 1000 : new Date().getTime()
  }

  getPeriod(): number {
    return this.period ? this.period * 1000 : 0;
  }

  /// Subprice in Ether
  async subscribe(subPrice: string): Promise<string> {
    let userPubKey = await this.purityWeb.getUserPubKey(this.web3.transactionOptions.from);
    const value = subPrice;
    console.log("pubkey", userPubKey);
    // if(userPubKey === "020x0000000000000000000000000000000000000000000000000000000000000000") {
    const subscriptionService = new EncryptionKeyService(this.web3.transactionOptions.from);
    userPubKey = subscriptionService.getCompressedPubKey();
    const pubKeyInContract = this.castPubKeyToContractStore(userPubKey);
    const data = this.contract.methods.subscribe(
      pubKeyInContract.pubKeyPrefix,
      pubKeyInContract.pubKey
    ).encodeABI()

    const web3Helper = new Web3Helper(this.web3)
    const popupId = `subscripton-${this.channelName}`
    return web3Helper.sendTransaction(popupId, this.contractAddress, value, data)

    // } else {
    //   this.contract.methods.subscribe().send({...this.web3.transactionOptions, value: value})
    //   .once('error', e => {
    //     reject(e);
    //   })
    //   .once('transactionHash', (hash: string) => {
    //     resolve(hash);
    //   })
    //   .once('receipt', (receipt: TransactionReceipt) => {
    //     transactionReceiptFunc(this, receipt);
    //   });
    // }
  }

  async setSubscriptionPrice(priceInEth: string): Promise<string> {
    const priceInWei = this.web3.client.utils.toWei(priceInEth);
    const data = this.contract.methods.setSubscriptionPrice(priceInWei).encodeABI()
    const web3Helper = new Web3Helper(this.web3)
    const popupId = `setSubscriptionPrice-${this.channelName}`
    return web3Helper.sendTransaction(popupId, this.contractAddress, "0", data)
  }

  /// Set User's comrpessed public key for subpscription content encryption.
  //TODO
  // async setUserPubKey(userPubKey: string) {
    //TODO
  // }

  async withdrawBalance(): Promise<string> {
    const data = this.contract.methods.withdrawBalance().encodeABI()
    const web3Helper = new Web3Helper(this.web3)
    const popupId = `withdrawBalance-${this.channelName}`
    return web3Helper.sendTransaction(popupId, this.contractAddress, "0", data)
  }

  async withdrawBalanceGas(): Promise<number> {
      return this.contract.methods.withdrawBalance().estimateGas(this.web3.transactionOptions);
  }

  /// fetch ALL subscribers' data of the channel and save to the store
  async fetchSubscribersWithKeys() {
    const subscribersWithKeys = await this.contract.methods.getSubscribersWithKeys().call(this.web3.transactionOptions);
    for (let i = 0; i < subscribersWithKeys.subscribers_.length; i++ ) {
      const compressedPubKey: string = castCompressedPubKeyFromContractStore(
        subscribersWithKeys.pubKeyPrefixes_[i],
        subscribersWithKeys.pubKeys_[i]
      );
      this.subscribers.push({
        address: subscribersWithKeys.subscribers_[i],
        decompressedPubKey: EthCrypto.publicKey.decompress(compressedPubKey)
      });
    }
  }

  /// @dev at action "subscribe" user can upload its key.
  private castPubKeyToContractStore(userPubKey: string): { pubKeyPrefix: boolean, pubKey: Array<number> } {
    let userPubKeyPart1: boolean = castPubKeyPrefixToBoolean(userPubKey.substr(0, 2));
    let userPubKeyPart2: string = userPubKey.substr(2, userPubKey.length);
    const userPubKey2 = this.web3.client.utils.hexToBytes("0x" + userPubKeyPart2);
    return {
      pubKeyPrefix: userPubKeyPart1,
      pubKey: userPubKey2
    }
  }

  // private async saveUserSubscribers() {
  //   StorageService.saveUserOwnedChannel(this, this.subscribers);
  // }

  //FILEUPLOADS

  getContentLabels(): Array<string> {
    return ["All", ...this.contentLabels];
  }

  getSubscriberContents(): Array<Content> {
    return this.subscriberContents ? this.subscriberContents : [];
  }

  getActiveContentLabel(): string {
    return this.activeContentLabel;
  }

  async setActiveContentLabel(newActiveLabel: string) {
    this.activeContentLabel = newActiveLabel;
    this.subscriberContents = [];
    this.nextFetchContentsPage = 0;
    this.hasContentFetchMore = true;
    await this.fetchLabelledContentIndexes(newActiveLabel);
    console.log("activeLabel", newActiveLabel);
  }

  async fetchLabelledContentIndexes(label: string) {
    if(!this.contentLabelIndexes[label]) {
      this.contentLabelIndexes[label] = await this.contract.methods.getLabelledContentIndexes(this.web3.client.utils.fromAscii(label)).call(this.web3.transactionOptions);
    }
  }

  async getLabelledContentIndexes(label: string): Promise<Array<number>> {
    await this.fetchLabelledContentIndexes(label);
    return this.contentLabelIndexes[label]
  }

  async getContent(index: number): Promise<Content> {
    const { protocol, contentType, fileAddress, summary, uploadTime } =
      await this.contract.methods.subscriberContents(index).call(this.web3.transactionOptions)
    return {
      protocol: +protocol,
      contentType: +contentType,
      fileAddress,
      summary,
      uploadTime
    }
  }

  async subscribeForNewContentUploaded(onNewContentUploadHappened: Function) {
    console.log(`sub for NewContentUploaded event at ${this.contractAddress}`, this.channelName);
    this.activeEvents.push(this.contract.events.NewContentUploaded({
      fromBlock: this.web3.lastBlockNumber,
    }, (error, event) => {
      if (error) {
        console.log(`Error at contract event listening: ${error}`);
      }
      console.log("contentUploadEvent", event);
      onNewContentUploadHappened(this);
    }));
  }

  async unsubscribeEvents() {
    for(const event of this.activeEvents) {
      event.unsubscribe();
    }
  }

  // If correct p2p name resolution technique will be available
  // this method should be enteded by that
  async uploadSubscriberContent(
    batchedLinks: string,
    protocol: FileProtocol,
    contentType: ContentType,
    contentSummary: string,
    contentLabel: string,
  ) {
    console.log("upload subscriber content");
    const contentLabelBytes = this.web3.client.utils.fromUtf8(contentLabel);

    const popupId = `uploadContent-${this.channelName}`
    const data = this.contract.methods.uploadSubscriberContent(
      protocol,
      batchedLinks,
      contentType,
      contentSummary,
      contentLabelBytes
    ).encodeABI()
    const web3Helper = new Web3Helper(this.web3)
    return web3Helper.sendTransaction(popupId, this.contractAddress, "0", data)
  }

  async fetchSubscriberContents(): Promise<void> {
    const page: number = this.nextFetchContentsPage;
    const items: number = this.fetchContentPageSize;
    console.log("contentPageSize", items);

    if(!this.hasContentFetchMore || this.subscriberContents.length >= (page + 1) * items) {
      return;
    }

    let contentLength = 0;
    if(this.activeContentLabel === "All") {
      contentLength = await this.contract.methods.getSubscriberContentsLength().call(this.web3.transactionOptions);
    } else {
      contentLength = this.contentLabelIndexes[this.activeContentLabel].length;
    }
    const contentFetchIndex = contentLength - (page * items) - 1;

    const contents: Array<Content> = [];

    for (let i = contentFetchIndex; i > contentFetchIndex - items && i >= 0; i--) {
      let contentIndex: number = i;
      if(this.activeContentLabel !== "All") {
        contentIndex = this.contentLabelIndexes[this.activeContentLabel][i];
      }
      const content = await this.contract.methods.subscriberContents(contentIndex).call(this.web3.transactionOptions);
      contents.push(content);
    }

    if(contentFetchIndex - items < 0) {
      this.hasContentFetchMore = false;
    }

    this.subscriberContents = this.subscriberContents.concat(contents);
  }

  needMoreContents() {
    this.nextFetchContentsPage++;
  }

  async fetchContentLabels(): Promise<void> {
    const contentLabels = await this.contract.methods.getContentLabels().call(this.web3.transactionOptions);
    this.contentLabels = [];
    for (const contentLabel of contentLabels) {
      this.contentLabels.push(
        this.web3.client.utils.toUtf8(contentLabel)
      );
    }
  }
}

export default ContentChannel;
