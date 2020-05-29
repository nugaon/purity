import React from 'react';
import { ReactNotificationHandler } from '../services/notifications';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { GiSettingsKnobs } from "react-icons/gi";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "../App.css";
import ContentChannel from "../contracts/ContentChannel";
import { Web3Helper } from "../services/Web3Helper";

interface Props {
  contentChannel: ContentChannel;
}

interface State {
  showModal: boolean;
  loadingSetSubscriptionPrice: boolean;
  loadingSetDescription: boolean;
  description: string;
}

export class ChannelSettings extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.setSubscriptionPrice = this.setSubscriptionPrice.bind(this);
    this.setDescription = this.setDescription.bind(this);

    this.state = {
      showModal: false,
      loadingSetSubscriptionPrice: false,
      loadingSetDescription: false,
      description: props.contentChannel.description
    };
  }

  handleClose() {
    this.setState({
      showModal: false
    });
  }

  handleShow() {
    this.setState({
      showModal: true
    });
  }

  async setDescription(e) {
    e.preventDefault();
    if(this.state.loadingSetDescription) {
      return;
    }

    this.setState({
      loadingSetDescription: true
    });
    // const description = e.target.elements.description.value;
    const description = this.state.description;
    ReactNotificationHandler.addNotification({
      title: "Set Description",
      message: `Send Description request at '${this.props.contentChannel.channelName}'`,
    });
    await this.props.contentChannel.setDescription(description);
    this.setState({
      loadingSetDescription: false
    });
  }

  async setSubscriptionPrice(e) {
    e.preventDefault();
    if(this.state.loadingSetSubscriptionPrice) {
      return;
    }

    this.setState({
      loadingSetSubscriptionPrice: true
    });
    const price = e.target.elements.subPrice.value;
    ReactNotificationHandler.addNotification({
      title: "Set Subscription Price",
      message: `Supscription price changed to ${price} at '${this.props.contentChannel.channelName}'`,
    });
    const txId = await this.props.contentChannel.setSubscriptionPrice(price);
    this.setState({
      loadingSetSubscriptionPrice: false
    });
  }

  render() {
    return (
      <>
      <span className="clickable dot" onClick={this.handleShow}><GiSettingsKnobs /></span>

      <Modal show={this.state.showModal} onHide={this.handleClose}>

        <Modal.Header closeButton>
          <Modal.Title>{this.props.contentChannel.channelName} Channel Settings</Modal.Title>
        </Modal.Header>

        <Modal.Body className="marginBottomForChildren">

          <Form className="clearfix" onSubmit={this.setDescription}>
            <div>
              <div className="inputGroup">
                <div>Description</div>
                <SimpleMDE value={this.props.contentChannel.description} onChange={ value => { this.setState({ description: value }) }} />
                <div className="description">
                  Write a description for your Channel, which explains what your Channel is about.
                </div>
              </div>
              <Button className="float-right noBorder" type="submit">Change</Button>
            </div>
          </Form>

          <Form onSubmit={this.setSubscriptionPrice}>
            <div className="inputGroup">
              <div>
                Subscription Price [ETH]
              </div>
              <InputGroup>
                <Form.Control name="subPrice" defaultValue={this.props.contentChannel.price} type="text"/>
                <InputGroup.Append>
                  <Button type="submit">Change</Button>
                </InputGroup.Append>
              </InputGroup>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    );
  }
}
