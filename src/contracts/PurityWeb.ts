import contractAbi from "./abis/PurityWeb";
// import Subscriptions from "./Subscriptions";
import ContentChannel from "./ContentChannel";
import { ExtendedWeb3Client, Category } from "../IApp";
import { Contract } from "web3-eth-contract";
import { TransactionReceipt } from "web3-core";
import { castPubKeyPrefixToString } from "./helpers/PubKeyCast";
import { Web3Helper } from "../services/Web3Helper";

interface Props {
  web3: ExtendedWeb3Client;
  contractAddress: string;
}

class PurityWeb {

  public categories: Array<Category>;
  public hasCategoriesFetchMore: boolean;
  private web3: ExtendedWeb3Client;
  private contractAddress: string;
  private contract: Contract;
  private nextFetchCategoriesFrom: number; //catory ID where it will fetch from
  private fetchCategoriesPageSize: number;

  constructor(props: Props) {
    this.web3 = props.web3;
    this.contractAddress = props.contractAddress;
    this.contract = new this.web3.client.eth.Contract(contractAbi, this.contractAddress);
    //categories fetch
    this.categories = [];
    this.hasCategoriesFetchMore = true;
    this.nextFetchCategoriesFrom = 0;
    this.fetchCategoriesPageSize = 5;
  }

  async initContract() {
  }

  getUser() {
    return this.web3.transactionOptions.from;
  }

  /// CATEGORIES

  async fetchCategories() {
    const page: number = this.nextFetchCategoriesFrom;
    const items: number = this.fetchCategoriesPageSize;

    if(!this.hasCategoriesFetchMore) {
      return;
    }

    const categories = await this.getCategories(page, items);
    for (const category of categories) {
      if(category.channelCount == 0) {
        this.hasCategoriesFetchMore = false;
        break;
      } else {
        this.categories.push(category);
        this.nextFetchCategoriesFrom = category.id;
      }
    }
  }

  needMoreCategories() {
    this.nextFetchCategoriesFrom++;
  }

  resetCategories() {
    this.hasCategoriesFetchMore = true;
    this.nextFetchCategoriesFrom = 0;
    this.categories = [];
  }

  async getCategories(fromCategoryId: number, size: number): Promise<Array<Category>> {
    // let categoryName: Array<Array<string>>;
    // let categoryChannelCount: Array<number>;
    // let categoryIds: Array<number>;
    const result: Array<Category> = [];
    const response: {
      0: Array<string>, //category names in bytes
      1: Array<number>, //category channel creation count
      2: Array<number> //category id
    } = await this.contract.methods.getCategories(fromCategoryId, size).call(this.web3.transactionOptions);
    for (let i = 0; i < size; i++) {
      const name: string = this.web3.client.utils.toUtf8(response[0][i]);
      const channelCount: number = response[1][i];
      const channelId: number = response[2][i];
      result.push({
        name: name,
        channelCount: channelCount,
        id: channelId
      });
    }
    return result;
  }

  async getCategoryLength(topic: string) {
    const hexaTopic = this.web3.client.utils.fromAscii(topic);

    try {
      const response = await this.contract.methods.getCategoryLength(hexaTopic).call(this.web3.transactionOptions);
      return response;
    } catch(e) {
      console.log("Error at getTopicLength", e);
    }
  }

  /// CHANNELS

  async createContentChannel(
    channel: string,
    topic: string,
    subPrice: number,
    subTimeInSeconds: number,
    permitExternalSubs: boolean,
    description: string
  ): Promise<string> {
    const hexaTopic = this.web3.client.utils.utf8ToHex(topic);
    const hexaChannel = this.web3.client.utils.utf8ToHex(channel);
    const subPriceInWei = this.web3.client.utils.toWei(subPrice.toString());
    console.log("hexachannel", hexaChannel);
    console.log("hexaTopic", hexaTopic);
    console.log("subPrice", subPrice);
    console.log("description", description);
    console.log("transactionOptions", this.web3.transactionOptions);

    console.log("sdgasdgasdgsdh", this.contract.methods.createContentChannel)
    const functionContract = this.contract.methods.createContentChannel(
      hexaChannel,
      hexaTopic,
      subPriceInWei,
      subTimeInSeconds,
      permitExternalSubs,
      description
    )
    console.log('functsdt', functionContract)
    const data = this.contract.methods.createContentChannel(
      hexaChannel,
      hexaTopic,
      subPriceInWei,
      subTimeInSeconds,
      permitExternalSubs,
      description
    ).encodeABI()
    console.log("sdfgasdgsdg", data)

    const web3Helper = new Web3Helper(this.web3)
    const popupId = `createChannel-${channel}`
    const txId = await web3Helper.sendTransaction(popupId, this.contractAddress, "0", data)
    // wait for receipt
    await web3Helper.waitForTransactionSuccess(txId)

    return txId
  }

  /// Get channels' addresses
  async getChannelsFromCategories(categoryName: string, fromContentChannelId: number = 0, size: number = 3): Promise<Array<string>> {
    const hexaCategory = this.web3.client.utils.fromAscii(categoryName);

    const response = await this.contract.methods.getChannelsFromCategories(hexaCategory, fromContentChannelId, size).call(this.web3.transactionOptions);
    return response;
  }

  /// get how many coins will be substracted in percents from the whole balance
  async getWithdrawFee(): Promise<number> {
    return this.contract.methods.withdrawFeePercent().call(this.web3.transactionOptions);
  }

  /// INITS

  // async getSubscriptionInstance(channelStructInstance) {
  //   if (channelStructInstance.subscriptionHandler === '0x0000000000000000000000000000000000000000') {
  //     throw new Error(`Channel doesn't exist`);
  //   }
  //   const subscription = new Subscriptions({
  //     web3: this.web3,
  //     contractAddress: channelStructInstance.subscriptionHandler,
  //     channelName: channelStructInstance.channelName
  //   });
  //
  //   await subscription.initContract();
  //   return subscription;
  // }

  async getContentChannelInstance(channel: string): Promise<ContentChannel> {
    const channelName = this.web3.client.utils.fromAscii(channel);
    console.log("getContentChannelInstance -> channelname", channelName);
    const channelAddress: string = await this.contract.methods.getChannelAddressFromName(channelName).call(this.web3.transactionOptions);

    if (channelAddress === "0x0000000000000000000000000000000000000000") {
      throw Error("Channel doesn't exist on PurityWeb");
    }

    const contentChannelInstance = await this.initContentChannelInstanceFromAddress(channelAddress);
    return contentChannelInstance;
  }

  async initContentChannelInstanceFromAddress(address: string): Promise<ContentChannel> {
    console.log("initChannelFromAddress", address);
    const contentChannelInstance = new ContentChannel({
      contractAddress: address,
      web3: this.web3
    });

    await contentChannelInstance.initContract();
    return contentChannelInstance;
  }

  /// USER keys

  async getUserPubKey(userAddress: string): Promise<string> {
    const userDetails = await this.contract.methods.userKeys(userAddress).call(this.web3.transactionOptions);
    let userPubKeyPart1 = castPubKeyPrefixToString(userDetails.pubKeyPrefix);
    return userPubKeyPart1 + userDetails.pubKey;
  }
}

export default PurityWeb;
