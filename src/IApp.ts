import { default as Web3 } from "web3";
import { SendOptions } from "web3-eth-contract";
import { SubscriberData } from "./contracts/ContentChannel";

export interface Category {
  name: string;
  channelCount: number;
  id: number;
}

export interface ExtendedWeb3Client {
  transactionOptions: SendOptions;
  client: Web3;
  lastBlockNumber: number | "latest"
}

// Differs from the data which get from the contract.
export interface ContentChannelData {
  channelName: string; // also the key at the users storage array
  contentChannelAddress: string;
  subscribers?: Array<SubscriberData>;
  owner: string;
}

export interface Content {
    protocol: number;
    contentType: number;
    fileAddress: string;
    password?: string;
    summary?: string;
    uploadTime: number; //timeStamp
}

export type PageSection = "categories" | "ownedChannels" | "subscriptions" | "none";

export enum FileProtocol {
  DNS,
  IPFS,
  IPNS,
}

export enum ContentType {
  UNDEFINED, //can be image, video or anything that the webbroswer can open.
  WEBPAGE,
  PREMIUM = 100, //For premium contents -> always IPFS or SWARM
  ENCRYPTED_PREMIUM
}
