import React from 'react';
import TimeAgo from "react-timeago";
import { ReactNotificationHandler } from '../services/notifications';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import "../App.css";
import ContentChannel from "../contracts/ContentChannel";
import PurityWeb from "../contracts/PurityWeb";
import { initPurityWebInstance } from "../services/initPurityWebInstance";
import { ExtendedWeb3Client } from "../IApp";
import { TransactionReceipt } from "web3-core";
import { EncryptionKeyService } from "../services/EncryptionKeyService";
import { StorageService } from "../services/StorageService";
import { Web3Helper } from "../services/Web3Helper";
import Loading from "../texts/Loading"

interface Props {
  web3: ExtendedWeb3Client;
  onSubscriptionChange: Function;
}

interface State {
  channelName: string;
  chosenChannel: ContentChannel | null;
  showModal: boolean;
  loading: boolean;
}

export class SubscribeToChannel extends React.Component<Props, State> {

  private userSubTime: number; //timestamp
  private purityWeb: PurityWeb;

  constructor(props: Props) {
    super(props);
    this.handleSubscribe = this.handleSubscribe.bind(this);
    this.handlePremiumSubscribe = this.handlePremiumSubscribe.bind(this);
    this.succesfullSubscription = this.succesfullSubscription.bind(this);
    this.handleChannelChange = this.handleChannelChange.bind(this);
    this.fetchChannel = this.fetchChannel.bind(this);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = this.initState();
  }

  handleChannelChange(e) {
    this.setState({channelName: e.target.value});
  }

  initState(): State {
    return {
      showModal: false,
      chosenChannel: null,
      channelName: "",
      loading: false
    }
  }

  async fetchChannel(e) {
    e.preventDefault();
    try {
      const contentChannel = await this.purityWeb.getContentChannelInstance(this.state.channelName);
      await contentChannel.fetchPeriodTime();
      const userSubTime = contentChannel.getUserSubTime() ? contentChannel.getUserSubTime() : new Date().getTime();
      this.userSubTime = userSubTime + contentChannel.getPeriod();
      this.setState({
        chosenChannel: contentChannel
      });
    } catch(e) {
      console.log("fetchChannel", e);
      ReactNotificationHandler.addNotification({
        title: "Channel not exist",
        message: `Channel ${this.state.channelName} does not exist`,
        type: "warn"
      });
    }
  }

  async handleSubscribe() {
    const newSubscription = this.state.chosenChannel;

    if (!newSubscription) {
      return;
    }

    await StorageService.saveUserSubscribedChannel(newSubscription);
    this.props.onSubscriptionChange(newSubscription);

    ReactNotificationHandler.addNotification({
      title: "Subscribe to channel",
      message: `You succesfully subscribed for the channel!`,
      type: 'success',
    });

    this.setState(this.initState());
  }

  async handlePremiumSubscribe() {
    let channelName = this.state.channelName;

    if (channelName === '') {
      return;
    }

    this.setState({loading: true})

    const newSubscription = await this.blockchainSubscribe();
    if (!newSubscription) {
      this.setState({loading: false})
      return;
    }

    //init encryptionKey
    //new EncryptionKeyService(this.props.web3.transactionOptions.from);

    this.setState(this.initState());
  }

  // Private functions

  async blockchainSubscribe(): Promise<string | boolean> {

    if(this.state.chosenChannel === null) {
      return false;
    }

    try {
      const chosenChannel = this.state.chosenChannel
      const subPriceInEther = chosenChannel.price ? chosenChannel.price : "0";
      const txId = await chosenChannel.subscribe(subPriceInEther)
      const web3Helper = new Web3Helper(this.props.web3)
      await web3Helper.waitForTransactionSuccess(txId)
      this.succesfullSubscription(chosenChannel)

      return txId;

    } catch(e) {
      ReactNotificationHandler.addNotification({
        title: "Subscribe to channel",
        message: e.toString(),
        type: "warn"
      });
      return false;
    }
  }

  async succesfullSubscription(newSubscription: ContentChannel) {
    console.log("successful subscription")

    await StorageService.saveUserSubscribedChannel(newSubscription);
    this.props.onSubscriptionChange(newSubscription);

    ReactNotificationHandler.addNotification({
      title: "Subscribe to channel",
      message: `You succesfully subscribed for the channel!`,
      type: 'success',
    });
  }

  handleClose() {
    this.setState(this.initState());
  }

  handleShow() {
    this.setState({
      showModal: true
    });
  }

  render() {
    this.purityWeb = initPurityWebInstance(this.props.web3);

    return (
      <>
        <Button className="btn-block regularButton" onClick={(e) => this.setState({showModal: !this.state.showModal})}>Subscribe to Channel</Button>

        <Modal show={this.state.showModal} onHide={this.handleClose}>
        <Form onSubmit={ this.handlePremiumSubscribe }>

          <Modal.Header closeButton>
            <Modal.Title>Subscribe to a Channel</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="inputGroup">
              <InputGroup>
                <Form.Control name="channelName" onChange={this.handleChannelChange} placeholder="Channel name" type="text"/>
                <InputGroup.Append>
                  <Button onClick={ this.fetchChannel }type="submit">Check</Button>
                </InputGroup.Append>
              </InputGroup>
              <div className="description">
                Type the name of the Channel that you want to subscribe to,
                then press the "Check" to show subscription information about it.
              </div>
            </div>

            <div className="container" style={{display: this.state.chosenChannel ? '' : 'none'}}>
              Chosen Channel: {this.state.chosenChannel ? this.state.chosenChannel.channelName : "None"}<br />
              Subscribe for premium for <TimeAgo date={ new Date(this.userSubTime) } /><br />
              Premium fee: {this.state.chosenChannel ? this.state.chosenChannel.price: "0"} <span className="currency">ETH</span>
            </div>

            <Loading loading={this.state.loading}/>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Close
            </Button>
            <Button
              onClick={this.handleSubscribe}
              disabled={this.state.chosenChannel === null || this.state.loading}
            >
              Only Notifications
            </Button>
            <Button
              onClick={this.handlePremiumSubscribe}
              variant="primary"
              disabled={this.state.chosenChannel === null || this.state.loading}
            >
              For Premium
            </Button>
          </Modal.Footer>
        </Form>
        </Modal>
      </>
    );
  }
}
