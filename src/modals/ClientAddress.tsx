import React from 'react';
import { default as store } from 'store';
import { ReactNotificationHandler } from '../services/notifications';
import { Modal, Form, Button } from 'react-bootstrap';
import { ListGroup } from 'react-bootstrap';
import { StorageService } from "../services/StorageService";
import "./ClientAddress.css";

interface Props {
  accounts: Array<string>;
  clientAddress: string;
  onChangeClientAccount: Function;
  onCreateAddress: Function
}

interface States {
  showModal: boolean;
  clientAddress: string;
}

export class ClientAddress extends React.Component<Props, States> {

  constructor(props: Props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.chooseClientAddress = this.chooseClientAddress.bind(this);
    this.handleChangeClientAccount = this.handleChangeClientAccount.bind(this);

    this.state = {
      showModal: false,
      clientAddress: props.clientAddress,
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

  async handleChangeClientAccount(e) {
    e.preventDefault();
    let clientAddress = this.state.clientAddress;
    e.target.reset();

    if (clientAddress === '') {
      return;
    }

    //TODO check from web3 it can be.
    StorageService.setClientAddress(clientAddress);

    ReactNotificationHandler.addNotification({
      title: "Change Client Account",
      message: `You succesfully changed your client address!`,
      type: 'success',
    });

    this.props.onChangeClientAccount(clientAddress);

    this.handleClose();
  }

  chooseClientAddress(address: string) {
    this.setState({
      clientAddress: address
    });
  }

  render() {
    const accounts = this.props.accounts.map((account, i) => {
      return (
          <ListGroup.Item
            as="li"
            key={this.state.clientAddress+ "-" + account}
            className={ this.state.clientAddress && account.toUpperCase() === this.state.clientAddress.toUpperCase() ? 'active clickable' : 'clickable' }
            action onClick={ () => this.chooseClientAddress(account) }>
            {account}
          </ListGroup.Item>
      );
    });

    return (
      <>
      <a id="clientAccount" className="clickable" onClick={this.handleShow}>{this.props.clientAddress}</a>

      <Modal show={this.state.showModal} onHide={this.handleClose}>
      <Form onSubmit={ this.handleChangeClientAccount }>

        <Modal.Header closeButton>
          <Modal.Title>Change Client Ethereum Address</Modal.Title>
        </Modal.Header>

        <Modal.Body>
        <ListGroup as="ol">
          { accounts }
        </ListGroup>

        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button variant="secondary" onClick={() => this.props.onCreateAddress()}>
            Create
          </Button>
          <Button variant="primary" type="submit" value="Submit">
            Change
          </Button>
        </Modal.Footer>
      </Form>
      </Modal>
      </>
    );
  }
}
