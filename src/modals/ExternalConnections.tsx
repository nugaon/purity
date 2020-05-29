import React from 'react';
import { ReactNotificationHandler } from '../services/notifications';
import { Modal, Form, Button, OverlayTrigger, Tooltip, } from 'react-bootstrap';
import { GiEarthAfricaEurope } from "react-icons/gi";
import "../App.css";
import { StorageService } from "../services/StorageService";

interface Props {
  onWeb3Changed: Function;
}

interface State {
  showModal: boolean;
  web3ConnectionType: "direct";
}

export class ExternalConnections extends React.Component<Props, State> {
  private ipfsGateway: string;
  private web3ConnectionString: string;
  private ipfsPort: number;
  private ipfsProtocol: "http" | "https";
  private ipfsHost: string;

  constructor(props: Props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.setWeb3Connection = this.setWeb3Connection.bind(this);
    this.setIpfsConnection = this.setIpfsConnection.bind(this);

    const ipfsConnection = StorageService.getIpfsConnection();
    this.ipfsHost = ipfsConnection.host;
    this.ipfsPort = ipfsConnection.port;
    this.ipfsProtocol = ipfsConnection.protocol;
    this.ipfsGateway = StorageService.getIpfsGateway();
    this.web3ConnectionString = StorageService.getWeb3ConnectionString();


    this.state = {
      showModal: false,
      web3ConnectionType: "direct"
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

  private setWeb3Connection(e) {
    e.preventDefault();
    if(this.state.web3ConnectionType === "direct") {
      this.web3ConnectionString = e.target.elements.endpoint.value;
      StorageService.setWeb3ConnectionString(this.web3ConnectionString);
    }
    StorageService.setWeb3ConnectionType(this.state.web3ConnectionType);
    this.props.onWeb3Changed();

    ReactNotificationHandler.addNotification({
      title: "Set Web3 Connection",
      message: `Your Web3 connection has changed to ${this.state.web3ConnectionType} connection`,
      type: "success"
    });
  }

  private setIpfsConnection(e) {
    e.preventDefault();
    this.ipfsHost = e.target.elements.host.value;
    this.ipfsPort = e.target.elements.port.value;
    this.ipfsProtocol = e.target.elements.protocol.value;
    this.ipfsGateway = e.target.elements.gateway.value;

    StorageService.setIpfsConnection(
      this.ipfsHost,
      this.ipfsPort,
      this.ipfsProtocol
    );
    StorageService.setIpfsGateway(
      this.ipfsGateway
    );

    ReactNotificationHandler.addNotification({
      title: "Set IPFS Config",
      message: `IPFS configuration has been set.`,
      type: "success"
    });
  }

  render() {
    return (
      <>
      <OverlayTrigger
        key="bottom"
        overlay={
          <Tooltip id="tooltip-search">
            External Connection Settings
          </Tooltip>
        }
      >
        <GiEarthAfricaEurope className="clickable" color="#53bac0" onClick={this.handleShow} />
      </OverlayTrigger>

      <Modal show={this.state.showModal} onHide={this.handleClose}>

        <Modal.Header closeButton>
          <Modal.Title>External connections</Modal.Title>
        </Modal.Header>

        <Modal.Body className="marginBottomForChildren">

          <h4 style={{color: "black"}}>Web3 connection</h4>
          <Form onSubmit={this.setWeb3Connection}>
            <div className="inputGroup">
              <div>
                Connection type
              </div>
              <Form.Control
                defaultValue={this.state.web3ConnectionType}
                as="select"
                onChange={(e: any) => this.setState({
                  web3ConnectionType: e.target.value
                })}
                name="protocol"
                type="number"
              >
                <option value="metamask">Metamask</option>
                <option value="direct">Ethereum Node</option>
              </Form.Control>
            </div>
            <div className="inputGroup">
              <div>
                Endpoint
              </div>
              <Form.Control name="endpoint" defaultValue={this.web3ConnectionString} type="text"/>
            </div>

            <Button className="float-right marginTop regularButton" type="submit">Change</Button>
          </Form>

          <h4 style={{color: "black"}}>IPFS connection</h4>
          <Form onSubmit={this.setIpfsConnection}>

            <div className="inputGroup">
              <div>
                Gateway
              </div>
              <Form.Control name="gateway" defaultValue={this.ipfsGateway} type="text"/>
              <div className="description">
                You can choose any gateway to reach IPFS content in your browser.
                For a list of available public gatways check <a target="external-content" href="https://ipfs.github.io/public-gateway-checker/">this</a> site.
              </div>
            </div>

            <div className="inputGroup">
              <div>
                API host
              </div>
              <Form.Control name="host" defaultValue={this.ipfsHost} type="text"/>
            </div>

            <div className="inputGroup">
              <div>
                Port
              </div>
              <Form.Control name="port" defaultValue={this.ipfsPort} type="number"/>
            </div>

            <div className="inputGroup">
              <div>
                Protocol
              </div>
              <Form.Control defaultValue={this.ipfsProtocol} as="select" name="protocol" type="number">
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </Form.Control>
            </div>

            <Button className="float-right marginTop regularButton" type="submit">Change</Button>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" className="regularButton" onClick={this.handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    );
  }
}
