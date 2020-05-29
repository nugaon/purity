import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { OverlayTrigger, Tooltip, Container, Row, Col } from 'react-bootstrap';
import AnimatedNumber from 'animated-number-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { default as Web3 } from "web3";
import { default as store } from 'store';
import { Environment } from "./environments/Environment";
import { ExtendedWeb3Client, ContentChannelData, PageSection } from "./IApp";
import { default as PurityWeb } from "./contracts/PurityWeb";
import { default as ContentChannel } from "./contracts/ContentChannel";
import { SubscribeToChannel } from "./modals/SubscribeToChannel";
import { CreateContentChannel } from './modals/CreateContentChannel';
import { ExternalConnections } from "./modals/ExternalConnections";
import { CreateAddress } from "./modals/CreateAddress";
import { ClientAddress } from "./modals/ClientAddress";
import { UnlockAccount } from "./modals/UnlockAccount";
import { ListOwnedChannels } from './ListOwnedChannels';
import { ListSubscriptions } from "./ListSubscriptions";
import { SearchBar } from "./SearchBar";
import { initPurityWebInstance } from "./services/initPurityWebInstance";
import { ListContentChannels } from "./ListContentChannels";
import { StorageService } from "./services/StorageService";
import { ReactNotificationHandler } from './services/notifications';
import { BlockHeader, Syncing } from "web3-eth";
import { ListCategories } from "./ListCategories";
import {Subscription} from 'web3-core-subscriptions';
import {Log} from 'web3-core';
import {GiReceiveMoney, GiPayMoney} from 'react-icons/gi';
import {AiOutlineHistory, AiOutlineSync} from 'react-icons/ai';
import { IoMdRefresh } from 'react-icons/io';
import ReactDOM from 'react-dom';
import SendTransaction from './popups/SendTransaction';
import {shell, ipcRenderer} from "electron";
import {
  HashRouter as Router,
  Switch,
  Route,
  useParams
} from "react-router-dom";
import { Web3Helper } from "./services/Web3Helper";

interface State {
  ownedChannels: Array<ContentChannel>;
  subscriptions: Array<ContentChannel>;
  web3: ExtendedWeb3Client;
  purityWeb: PurityWeb;
  clientAddress: string;
  clientBalance: string;
  chosenChannelOrCategory: string;
  searchCount: number; //how many times the user searched.
  showCreateContentChannelModal: boolean;
  showSubscribeToChannelModal: boolean;
  showCreateAddressModal: boolean;
  showUnlockAccountModal: boolean;
  firstAccount: boolean;
  showSection: PageSection;
  ownedChannelsNoti: number;
  subscriptionsNoti: number;
  categoriesNoti: number;
  listCategoriesRefreshCount: number;
  userAccounts: Array<string>;
  netType: 'main' | 'test' | undefined;
  isSyncing: boolean; //syncing ethereum blocks
}

class App extends React.Component<any, State> {

  private web3: ExtendedWeb3Client;
  private purityWeb: PurityWeb;
  private ownedChannelComponent: React.RefObject<ListOwnedChannels>;
  private listSubscriptionsComponent: React.RefObject<ListSubscriptions>;
  private listCategoriesComponent: React.RefObject<ListCategories>;
  private accountSubscriptions: Array<Subscription<any>>;

  constructor(props) {
    super(props);

    this.handleChangeClientAccount = this.handleChangeClientAccount.bind(this);
    this.handleSubscriptionHappened = this.handleSubscriptionHappened.bind(this);
    this.handleNewContentUploadHappened = this.handleNewContentUploadHappened.bind(this);
    this.menuBarClick = this.menuBarClick.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleChannelPriceChanged = this.handleChannelPriceChanged.bind(this);
    this.handleWeb3Changed = this.handleWeb3Changed.bind(this);
    this.onTransactionHistoryClick = this.onTransactionHistoryClick.bind(this);
    this.reInitConnections = this.reInitConnections.bind(this);
    this.handleBalanceFetch = this.handleBalanceFetch.bind(this);
    this.onSyncing = this.onSyncing.bind(this);
    this.endSyncing = this.endSyncing.bind(this);
    this.handleSendCoinsClick = this.handleSendCoinsClick.bind(this)
    this.initEmptyLocalStorage();
    this.initWeb3Instance();
    this.initPurityWebInstance();

    //createref -> handle events whih appears on these component
    this.ownedChannelComponent = React.createRef();
    this.listSubscriptionsComponent = React.createRef();
    this.listCategoriesComponent = React.createRef();

    const user = StorageService.getClientAddress();

    const ownedChannelInstances = this.initOwnedChannelInstances();
    const subscriptionInstances = this.initSubscriptionInstances();

    this.state = {
      clientAddress: user,
      clientBalance: "0",
      ownedChannels: ownedChannelInstances,
      subscriptions: subscriptionInstances,
      web3: this.web3,
      purityWeb: this.purityWeb,
      chosenChannelOrCategory: "",
      searchCount: 0,
      showCreateContentChannelModal: false,
      showSubscribeToChannelModal: false,
      showCreateAddressModal: false,
      showUnlockAccountModal: false,
      showSection: "none",
      ownedChannelsNoti: StorageService.getNotificationCounts("ownedChannels"),
      subscriptionsNoti: StorageService.getNotificationCounts("subscriptions"),
      categoriesNoti: StorageService.getNotificationCounts("categories"),
      listCategoriesRefreshCount: 0,
      userAccounts: [ user ],
      firstAccount: false,
      netType: undefined,
      isSyncing: false
    };

    this.accountSubscriptions = []

    //async functions
    this.asyncInits();

    store.set('initedStorage', true);
  }

  initEmptyLocalStorage() {
    if (!store.get('initedStorage')) {
      store.set('web3ConnectionString', StorageService.getWeb3ConnectionString());
      store.set('ipfsGateway', StorageService.getIpfsGateway());
      store.set("ipfsConnection", Environment.defaultValues.ipfsClientConfig);
      store.set('ownedChannels', {});
      store.set('subscriptions', {});
      StorageService.setClientAddress("");
    }
  }

  initPurityWebInstance() {
    this.purityWeb = initPurityWebInstance(this.web3);
  }

  private async asyncInits() {
    //additional instance inits from store
    if(!await this.testConnection()) {
      ReactNotificationHandler.addNotification({
        title: "No Connection",
        message: `There is no connection with the Ethereum Node server.`,
        type: "warn"
      });
      return;
    }
    let successful = await this.asyncInitWeb3Instance();
    if(!successful) {
      return; //wait for address creation
    }
    await this.handleBalanceFetch();
    await this.initOwnedChannels();
    await this.initSubscriptions();
    await this.afterAsyncInits();
    const web3Helper = new Web3Helper(this.web3);

    this.setState({
      ownedChannels: this.state.ownedChannels,
      subscriptions: this.state.subscriptions,
      netType: await web3Helper.getConnectionType()
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const connectionType = StorageService.getWeb3ConnectionType();

      const blockNumber = await this.web3.client.eth.getBlockNumber();
      console.log("testedConnection", blockNumber);
      return true;
    } catch(e) {
      return false;
    }
  }

  private async afterAsyncInits() {
    // if the user immediately refreshes the content after he got a new event in the current block.
    StorageService.saveLastBlock(await this.web3.client.eth.getBlockNumber() + 1);
  }

  initWeb3WithEthereumNode(): any {
    StorageService.setWeb3ConnectionType("direct");

    const connectionString = StorageService.getWeb3ConnectionString();
    return new Web3.providers.WebsocketProvider(connectionString);
  }

  initWeb3Instance() {
    console.log("init web3");
    let provider: any;

    provider = this.initWeb3WithEthereumNode();

    console.log("provider", provider);
    const client = new Web3(provider);

    let account = StorageService.getClientAddress();

    const transactionOptions = {
      from: account,
      gas: StorageService.getGasLimit(),
      gasPrice: StorageService.getGasPrice()
    };

    client.eth['getBalance2'] = client.eth.getBalance;
    const getBalance = async (address: string): Promise<string> => {
      return client.eth['getBalance2'](address);
    }
    client.eth.getBalance = getBalance;

    this.web3 = {
      client: client,
      transactionOptions: transactionOptions,
      lastBlockNumber: StorageService.getLastBlock()
    }
  }

  initSyncingSubscription() {
    this.web3.client.eth.subscribe('syncing', (error) => {
      if(error) {
        console.log(`Error at 'syncing' subscription ${error}`)
        return
      }
    }).on("data", (syncing: Syncing) => {
      console.log("syncing!!", syncing)
      if(syncing) {
        this.onSyncing()
      } else {
        this.endSyncing()
      }
    });
  }

  onSyncing() {
    this.setState({
      isSyncing: true
    })
  }

  endSyncing() {
    this.setState({
      isSyncing: false
    })
    this.asyncInits()
  }

  subscribeToAddressTransactions(address: string) {
    // console.log(`subscribe to logs at address ${address}`)
    // const addressLogs = this.web3.client.eth.subscribe('logs', {
    //   address: address,
    // }).on('data', log => {
    //   console.log(`!!!transaction happened at address ${address}`, log)
    //   //this.handleBalanceFetch();
    // })
    // this.accountSubscriptions.push(addressLogs)
  }

  async asyncInitWeb3Instance(): Promise<boolean> {
    const connectionType: "direct" = "direct";
    let account = StorageService.getClientAddress();
    const ablak: any = window;
    let accounts: Array<string> = [];
    accounts = await this.web3.client.eth.getAccounts();
    console.log("accounts", accounts);
    if(accounts.length === 0) {
      this.setState({
        showCreateAddressModal: true,
        firstAccount: true
      })
      return false;
    }
    if (!account) {
      account = accounts[0];
      StorageService.setClientAddress(account);

      this.web3.transactionOptions.from = account;

      this.setState({
        clientAddress: account,
        web3: this.web3
      });
    }
    const accountPassword = StorageService.getAccountPassword()
    if(accountPassword === undefined || accountPassword[account] === undefined) {
      this.setState({
        showUnlockAccountModal: true
      })
      return false;
    }

    this.subscribeToAddressTransactions(account)

    this.setState({
      userAccounts: accounts
    })

    //SUBSCRIPTIONS
    this.initSyncingSubscription();
    this.initWeb3LastBlock();

    await this.asyncInitPurityWeb();
    return true;
  }

  initWeb3LastBlock() {
    //subscribe for blockreceived for process updates meanwhile the user was not online.
    this.web3.client.eth.subscribe('newBlockHeaders', (error, result) => {
      if (error) {
        console.error("Error happened at new block", error);
        return;
      }
    })
    .on("data", function(blockHeader: BlockHeader){
      console.log("blockHeader", blockHeader);
      StorageService.saveLastBlock(blockHeader.number + 1);
    });
  }

  async asyncInitPurityWeb() {
    await this.purityWeb.initContract();
  }

  async initSubscriptions() {
    for (const subscriptionInstance of this.state.subscriptions) {
      await this.initSubscription(subscriptionInstance);
    }
  }

  async initOwnedChannels() {
    for (const ownedChannelInstance of this.state.ownedChannels) {
      await this.initOwnedChannel(ownedChannelInstance);
    }
  }

  async initOwnedChannel(ownedChannelInstance: ContentChannel) {
    //not necessary await
    ownedChannelInstance.subscribeForSubscriptionHappened(this.handleSubscriptionHappened);
    await ownedChannelInstance.initContract();
  }

  async handleSubscriptionHappened(channel: ContentChannel) {
    // init channel again without subscriptionhappened
    await channel.initContract();

    const newState = {};
    newState["ownedChannels"] = this.state.ownedChannels;
    if(this.state.showSection !== "ownedChannels") {
      newState["ownedChannelsNoti"] = this.state.ownedChannelsNoti + 1
    }
    if(this.ownedChannelComponent.current) {
      this.ownedChannelComponent.current.onSubscriptionHappened(channel);
    }

    this.setState(newState);
    StorageService.saveNotificationCounts("ownedChannels", this.state.ownedChannelsNoti);
  }

  async handleNewContentUploadHappened(channel: ContentChannel) {
    const newState = {};
    if(this.state.showSection !== "subscriptions") {
      newState["subscriptionsNoti"] = this.state.subscriptionsNoti + 1
    }
    if(this.listSubscriptionsComponent.current) {
      this.listSubscriptionsComponent.current.onContentUploadHappened(channel);
    }

    this.setState(newState);
    StorageService.saveNotificationCounts("subscriptions", this.state.subscriptionsNoti);

    ReactNotificationHandler.addNotification({
      title: "New Content Avilable!",
      message: `New Content Uploaded in '${channel.channelName}' channel`,
    });
  }

  async initSubscription(subscriptionInstance: ContentChannel) {
    //not necessary await
    subscriptionInstance.subscribeForNewContentUploaded(this.handleNewContentUploadHappened);
    //await subscriptionInstance.fetchUserSubTime();
    await subscriptionInstance.initContract();
  }

  private unsubscribeSubscriptionsEvents() {
    for (const subscriptionInstance of this.state.subscriptions) {
      subscriptionInstance.unsubscribeEvents();
    }
  }

  private unsubscribeOwnedChannelEvents() {
    for (const ownedChannel of this.state.ownedChannels) {
      ownedChannel.unsubscribeEvents();
    }
  }

  // render funcitons

  async handleOwnedChannelChange(channel: ContentChannel) {
    console.log("ownedChannelsChange");
    //this.handleBalanceFetch();
    const ownedChannels = this.state.ownedChannels.slice();
    await this.initOwnedChannel(channel);
    this.setState({
      ownedChannels: ownedChannels.concat([channel])
    });
  }

  async handleSubscriptionChange(channel: ContentChannel) {
    //this.handleBalanceFetch();
    const subscriptions = this.state.subscriptions.slice();
    const existedSubscriptions = subscriptions.filter((e) => { return e.channelName === channel.channelName });
    if(existedSubscriptions.length > 0) {
      const existedSubscription = existedSubscriptions[0]; // only one can be in the array
      // Only necessary inits.
      await existedSubscription.fetchUserSubTime();
      this.setState({
        subscriptions: this.state.subscriptions
      });
    } else {
      // Or init everything of the channel.
      await this.initSubscription(channel);
      this.setState({
        subscriptions: subscriptions.concat([channel])
      });
    }
  }

  async reInitConnections() {
    console.log("reInitConnections");
    //unsubscribe events
    this.unsubscribeSubscriptionsEvents();
    this.unsubscribeOwnedChannelEvents();

    this.initWeb3Instance();
    this.initPurityWebInstance();

    const ownedChannelInstances = this.initOwnedChannelInstances();
    const subscriptionInstances = this.initSubscriptionInstances();

    if(this.ownedChannelComponent.current)
      this.ownedChannelComponent.current.clientChange();

    if(this.listSubscriptionsComponent.current)
      this.listSubscriptionsComponent.current.clientChange();

    this.setState({
      purityWeb: this.purityWeb,
      web3: this.web3,
      ownedChannels: ownedChannelInstances,
      subscriptions: subscriptionInstances,
      ownedChannelsNoti: StorageService.getNotificationCounts("ownedChannels"),
      subscriptionsNoti: StorageService.getNotificationCounts("subscriptions"),
      showUnlockAccountModal: false, //if it come from the UnlockAccount modal
    });

    //async functions
    await this.asyncInits();

  }

  async handleChangeClientAccount(address: string) {
    if(this.web3.transactionOptions.from === address) {
      return
    }
    this.accountSubscriptions.forEach(item => item.unsubscribe());

    console.log(`accountsChanged!! to ${address}`);
    console.log("clientAddress before", this.web3.transactionOptions.from);

    StorageService.setClientAddress(address);

    this.setState({
      showCreateAddressModal: false,
      clientAddress: address,
    })

    await this.reInitConnections();

    console.log("clientAddress is", this.web3.transactionOptions.from);

  }

  async handleBalanceFetch() {
    const balance = this.web3.client.utils.fromWei(await this.web3.client.eth.getBalance(this.state.clientAddress), "ether");
    this.setState({
      clientBalance: balance
    });
    console.log("balance", balance);
  }

  // From storage
  private initOwnedChannelInstances(): Array<ContentChannel> {
    const ownedChannels: {[channelName: string]: ContentChannelData} = StorageService.getUserOwnedChannels();
    const ownedChannelWithInstances: Array<ContentChannel> = [];
    for(let key in ownedChannels) {
      ownedChannelWithInstances.push(
        this.initChannelInstance(ownedChannels[key])
      );
    }
    return ownedChannelWithInstances;
  }

  // From storage
  private initSubscriptionInstances(): Array<ContentChannel> {
    const subscriptions: {[channelName: string]: ContentChannelData} = StorageService.getUserSubscribedChannels();
    const subscriptionInstances: Array<ContentChannel> = [];
    for(let key in subscriptions) {
      subscriptionInstances.push(
        this.initChannelInstance(subscriptions[key])
      );
    }
    return subscriptionInstances;
  }

  /// Solves the initialization without calling async initContract method
  private initChannelInstance(channelFromStorage: ContentChannelData): ContentChannel {
    const contentChannel = new ContentChannel({
      web3: this.web3,
      contractAddress: channelFromStorage.contentChannelAddress,
      channelName: channelFromStorage.channelName,
      contentCreator: channelFromStorage.owner
    });

    return contentChannel;
  }

  private handleSearch(channelNameOrCategory: string) {
    this.setState({
      chosenChannelOrCategory: channelNameOrCategory,
      searchCount: this.state.searchCount + 1,
      showSection: "none"
    });
  }

  private handleWeb3Changed() {
    console.log("handleWeb3Changed");
    this.initWeb3Instance();
    this.initPurityWebInstance();

    const ownedChannelInstances = this.initOwnedChannelInstances();
    const subscriptionInstances = this.initSubscriptionInstances();

    this.setState({
      clientBalance: "0",
      ownedChannels: ownedChannelInstances,
      subscriptions: subscriptionInstances,
      web3: this.web3,
      purityWeb: this.purityWeb,
      chosenChannelOrCategory: "",
      showSection: "none",
    });

    //set empty the clientAddress, and in asyncInit set the first account from the new connection.
    StorageService.setClientAddress("");

    //async functions
    this.asyncInits();
  }

  private async handleChannelPriceChanged(contentChannel: ContentChannel) {
    const ownedChannels = this.state.ownedChannels.filter((e) => { return e.channelName === contentChannel.channelName });
    if(ownedChannels.length > 0) {
      await ownedChannels[0].initContract();
      const balance = this.web3.client.utils.fromWei(await this.web3.client.eth.getBalance(this.state.clientAddress), "ether");
      this.setState({
        ownedChannels: this.state.ownedChannels,
        clientBalance: balance,
      })
    }
  }

  private handleReceiveCoinsClick() {
    shell.openExternal('https://faucet.rinkeby.io/')
  }

  private async handleSendCoinsClick() {
    const id = "purity-1"
    const web3Helper = new Web3Helper(this.state.web3);
    const txId = await web3Helper.sendTransaction(id)
    console.log("User sent simple transaction with ID", txId)
  }

  private onTransactionHistoryClick() {
    shell.openExternal(`https://${this.state.netType == 'test' ? 'rinkeby.' : ''}etherscan.io/address/${this.state.clientAddress}`)
  }

  private menuBarClick(section: PageSection) {
    const newState = {};
    const notiKey = section + "Noti";
    newState[notiKey] = 0;
    newState["showSection"] = this.state.showSection !== section ? section : "none";
    if(newState["showSection"] === "categories") {
      newState["listCategoriesRefreshCount"] = this.state.listCategoriesRefreshCount + 1;
    }
    console.log("newstate", newState);
    this.setState(newState);

    StorageService.saveNotificationCounts(section, 0);
  }

  render() {
    const prettyNumber = function(number: string) {
      return parseFloat(number).toPrecision(6);
    }
    return (

      <Container className="App">
      <div id="floatingLoading" hidden={this.state.isSyncing === false}>
        <OverlayTrigger
          placement="left"
          overlay={
            <Tooltip id="tooltip-search">
              Ethereum Blockchain syncing
            </Tooltip>
          }
        >
          <AiOutlineSync className="rotate" />
        </OverlayTrigger>
      </div>
      <header className="App-header">
        <h1 id="purityweb-logo" className="fadeInDown animated">Purity</h1>
        <div hidden={!this.state.netType}>{this.state.netType == 'main' ? 'Mainnet' : 'Testnet' }</div>
      </header>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        />
      <Router>
        <Switch>
          <Route exact path="/">
            <UnlockAccount
              web3={this.state.web3}
              showModal={this.state.showUnlockAccountModal}
              onClose={this.reInitConnections}
            />
            <CreateAddress
              web3={this.state.web3}
              showModal={this.state.showCreateAddressModal}
              onClose={this.handleChangeClientAccount}
              firstAccount={this.state.firstAccount}
            />
            <header className="App-header">
              <Container>
                <SearchBar onSearch={this.handleSearch}/>
                <Row className="justify-content-center">
                  <span className="mainFontColor">
                    <AnimatedNumber
                      value={this.state.clientBalance}
                      duration={800}
                      formatValue={n => prettyNumber(n)}/> <span className="currency">ETH</span>
                  </span>
                </Row>
                <ClientAddress
                  accounts={this.state.userAccounts}
                  onChangeClientAccount={this.handleChangeClientAccount}
                  onCreateAddress={() => this.setState({ showCreateAddressModal: true, firstAccount: false })}
                  clientAddress={this.state.clientAddress}/>
                <Row className="justify-content-center">
                  <Col className="col-auto">
                    <ExternalConnections onWeb3Changed={this.handleWeb3Changed}/>&nbsp;
                  </Col>
                  <Col className="col-auto">
                    <OverlayTrigger
                      key="bottom"
                      overlay={
                        <Tooltip id="tooltip-search">
                          Transaction history
                        </Tooltip>
                      }
                    >
                      <AiOutlineHistory className="clickable" color="#53bac0" onClick={this.onTransactionHistoryClick}/>
                    </OverlayTrigger>
                  </Col>
                  <Col className="col-auto">
                    <OverlayTrigger
                      key="bottom"
                      overlay={
                        <Tooltip id="tooltip-search">
                          Refresh Balance
                        </Tooltip>
                      }
                    >
                      <IoMdRefresh className="clickable" color="#53bac0" onClick={this.handleBalanceFetch}/>
                    </OverlayTrigger>
                  </Col>
                  <Col className="col-auto">
                    <OverlayTrigger
                      key="bottom"
                      overlay={
                        <Tooltip id="tooltip-search">
                          Receive Coins
                        </Tooltip>
                      }
                    >
                      <GiReceiveMoney className="clickable" color="#53bac0" onClick={this.handleReceiveCoinsClick}/>
                    </OverlayTrigger>
                  </Col>
                  <Col className="col-auto">
                    <OverlayTrigger
                      key="bottom"
                      overlay={
                        <Tooltip id="tooltip-search">
                          Send Coins
                        </Tooltip>
                      }
                    >
                      <GiPayMoney className="clickable" color="#53bac0" onClick={this.handleSendCoinsClick}/>
                    </OverlayTrigger>
                  </Col>
                </Row>
              </Container>
            </header>
            <div className="maincontent">
              <Container>
                <Row xs={1} md={3} style={{margin: 1}}>
                  <Col
                    className={"mainButtons clickable justify-content-center" + (this.state.showSection === "categories" ? " mainButtonActive" : "")}
                    onClick={() => this.menuBarClick("categories")}
                  >
                    <span>
                      Categories &nbsp;
                      <span style={{display: this.state.categoriesNoti !== 0 ? '' : 'none'}} className="badge badge-danger">
                        {this.state.categoriesNoti}
                      </span>
                    </span>
                  </Col>
                  <Col
                    className={"mainButtons clickable justify-content-center" + (this.state.showSection === "ownedChannels" ? " mainButtonActive" : "")}
                    onClick={() => this.menuBarClick("ownedChannels")}
                  >
                    <span>
                      My Channels &nbsp;
                      <span style={{display: this.state.ownedChannelsNoti !== 0 ? '' : 'none'}} className="badge badge-danger">
                        {this.state.ownedChannelsNoti}
                      </span>
                    </span>
                  </Col>
                  <Col
                    className={"mainButtons clickable justify-content-center" + (this.state.showSection === "subscriptions" ? " mainButtonActive" : "")}
                    onClick={() => this.menuBarClick("subscriptions")}
                  >
                    <span>
                      Subscriptions &nbsp;
                      <span style={{display: this.state.subscriptionsNoti !== 0 ? '' : 'none'}} className="badge badge-danger">
                        {this.state.subscriptionsNoti}
                      </span>
                    </span>
                  </Col>
                </Row>

                <div className="marginTop" style={{display: this.state.showSection === "categories" ? '' : 'none'}}>
                  <ListCategories ref={this.listCategoriesComponent} refreshCount={this.state.listCategoriesRefreshCount} purityWeb={this.state.purityWeb} onSearch={this.handleSearch}/>
                </div>

                <div className="marginTop" style={{display: this.state.showSection === "ownedChannels" ? '' : 'none'}}>
                  <CreateContentChannel purityWeb={this.purityWeb} onOwnedChannelChange={channel => this.handleOwnedChannelChange(channel)}/>
                  <ListOwnedChannels ref={this.ownedChannelComponent} ownedChannels={this.state.ownedChannels} web3={this.web3} onSearch={this.handleSearch} onChannelPriceChange={this.handleChannelPriceChanged}/>
                </div>

                <div className="marginTop" style={{display: this.state.showSection === "subscriptions" ? '' : 'none'}}>
                  <SubscribeToChannel web3={this.state.web3} onSubscriptionChange={channel => this.handleSubscriptionChange(channel)}/>
                  <ListSubscriptions ref={this.listSubscriptionsComponent} subscriptions={this.state.subscriptions} onSearch={this.handleSearch} />
                </div>

              </Container>

              <Container style={{ paddingTop: 0}}>
                <div className="dividerMaincolor" style={{ marginBottom: 24}}></div>
                <ListContentChannels purityWeb={this.state.purityWeb} channelNameOrCategory={this.state.chosenChannelOrCategory} searchCount={this.state.searchCount}/>
              </Container>
            </div>

          </Route>
          <Route path="/sendtransaction/:popupId/:to?/:value?/:data?" >
            <SendTransaction web3={this.web3} netType={this.state.netType} />
          </Route>
        </Switch>
      </Router>
      </Container>
    );
  }
}

export default App;
