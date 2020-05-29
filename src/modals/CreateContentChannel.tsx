import React from 'react';
import { ReactNotificationHandler } from '../services/notifications';
import { Form, Button, Modal, InputGroup } from 'react-bootstrap';
import "../App.css";
import { default as PurityWeb } from "../contracts/PurityWeb";
import { default as ContentChannel } from "../contracts/ContentChannel";
import { TransactionReceipt } from "web3-core";
import { StorageService } from "../services/StorageService";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { sleepFunction } from "../services/sleepFunction";

interface Props {
  purityWeb: PurityWeb;
  onOwnedChannelChange: IOnOwnedChannelsChange;
}

interface State {
  showModal: boolean;
  description: string;
}

interface IOnOwnedChannelsChange {
  (contentChannel: ContentChannel): void
}

export class CreateContentChannel extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.handleCreateContentChannel = this.handleCreateContentChannel.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      showModal: false,
      description: ""
    }
  }

  async waitForChannelCreation(channelName: string): Promise<ContentChannel> {
    while(true) {
      try {
        const newChannel: ContentChannel = await this.props.purityWeb.getContentChannelInstance(channelName);
        return newChannel;
      } catch(e) {
        await sleepFunction();
      }
    }
  }

  async handleCreateContentChannel(e) {
    e.preventDefault();
    const channelName = e.target.elements.channelName.value;
    const channelType = e.target.elements.channelType.value;
    const subPrice = e.target.elements.subPrice.value;
    const subDays = e.target.elements.subDays.value;
    const permitExternalSubs = e.target.elements.permitExternalSubs.value;
    // const description = e.target.elements.description.value;
    const description = this.state.description;
    e.target.reset();

    if (channelName === '' || channelType === '') {
      return;
    }
    this.handleClose();
    const subTimeInSeconds: number = 60 * 60 * 24 * +subDays;

    try {
      const response = await this.blockchainCreateContentChannel(channelName, channelType, subPrice, subTimeInSeconds, permitExternalSubs, description);

      if (response) {
        const newChannel = await this.waitForChannelCreation(channelName);
        StorageService.saveUserOwnedChannel(newChannel);

        this.props.onOwnedChannelChange(newChannel);
      }
    } catch(e) {
      console.log("handleCreateContentChannel", e);
    }

  }

  // Private functions

  async blockchainCreateContentChannel(
    channel: string,
    topic: string,
    subPrice: number,
    subTimeInSeconds: number,
    permitExternalSubs: boolean,
    description: string
  ): Promise<string | boolean> {

    try {
      const response = await this.props.purityWeb.createContentChannel(channel, topic, subPrice, subTimeInSeconds, permitExternalSubs, description);

      ReactNotificationHandler.addNotification({
        title: "Create channel",
        message: `You created succesfully your '${channel}' channel!`,
        type: 'success',
      });

      return response;
    } catch(e) {
      console.log(e);
      ReactNotificationHandler.addNotification({
        title: "Create channel",
        message: e.message,
        type: "warn"
      });
      return false;
    }
  }

  handleClose() {
    this.setState({
      showModal: false
    });
  }

  render() {
    return (
      <>
        <Button className="btn-block regularButton" onClick={(e) => this.setState({showModal: !this.state.showModal})}>Create Channel</Button>

        <Modal className="listBox" show={this.state.showModal} onHide={this.handleClose}>
        <Form onSubmit={ this.handleCreateContentChannel }>

        <Modal.Header closeButton>
          <Modal.Title>Create your own channel</Modal.Title>
        </Modal.Header>
        <Modal.Body className="marginBottomForChildren">
          <div className="inputGroup">
            <div>Channel's Name</div>
            <Form.Control name="channelName" type="text"/>
            <div className="description">
              The users can find your Channel by its name (or its Category).
              Keep in mind, this name is not changable.
            </div>
          </div>

          <div className="inputGroup">
            <div>Category</div>
            <Form.Control name="channelType" type="text"/>
            <div className="description">
              Your Channel has to belong to one Category, which implies the common
              topic of its channels cover. To find the correct Category name for your channel,
              check the "Categories" menu on the mainpage. If you don't find matching one,
              type your own and it will be automatically created.
            </div>
          </div>

          <div className="inputGroup">
            <div>Subscription Price [ETH]</div>
            <Form.Control name="subPrice" defaultValue="0.1" type="text"/>
            <div className="description">
              The users can Subscribe to your Channel to become Premium Users for the fee specified above.
              Premium Users are able to retrieve your Premium Content or even you can reward them on your dApp site.
            </div>
          </div>

          <div className="inputGroup">
            <div>Subscription Time (days)</div>
            <Form.Control name="subDays" defaultValue="30" type="number"/>
            <div className="description">
              For how many days this subscription is valid.
            </div>
          </div>

          <div className="inputGroup">
            <Form.Check type="checkbox" defaultChecked label="Permit external subscriptions" name="permitExternalSubs"/>
            <div className="description">
              If you allow the external subscriptions, anybody can subscribe to your channel for the specified fee to use your Premium Content.
            </div>
          </div>

          <div className="inputGroup">
            <div>Description</div>
            <SimpleMDE onChange={ value => { this.setState({ description: value }) }} />
            <div className="description">
              Write a description for your Channel, which explains what your Channel is about.
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit" value="Submit">
            Create
          </Button>
        </Modal.Footer>
        </Form>
        </Modal>
      </>
    );
  }
}
