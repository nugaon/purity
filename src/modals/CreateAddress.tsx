import React from 'react';
import { ExtendedWeb3Client } from "../IApp";
import { OverlayTrigger, Tooltip, Modal, Form, Button } from 'react-bootstrap';
import { GiSettingsKnobs } from "react-icons/gi";
import "easymde/dist/easymde.min.css";
import "../App.css";
import ContentChannel from "../contracts/ContentChannel";
import ErrorMessage from "../texts/ErrorMessage";
import Loading from "../texts/Loading";
import { StorageService } from "../services/StorageService";

interface Props {
  showModal: boolean;
  onClose: Function;
  web3: ExtendedWeb3Client;
  firstAccount: boolean;
}

interface State {
  showModal: boolean;
  showWelcome: boolean;
  address: string;
  password: string;
  passwordError: boolean;
  syncing: boolean;
  creationLoading: boolean;
}

export class CreateAddress extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.createAddress = this.createAddress.bind(this);
    this.waitForEndSyncing = this.waitForEndSyncing.bind(this);

    this.state = {
      showModal: props.showModal,
      showWelcome: true,
      address: "",
      password: "",
      passwordError: false,
      syncing: true,
      creationLoading: false,
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

  async createAddress(e) {
    e.preventDefault();
    this.setState({
      creationLoading: true
    })
    const password = e.target.elements.password.value;
    const password2 = e.target.elements.password2.value;

    if(password !== password2) {
      this.setState({
        passwordError: true,
        creationLoading: false
      })
      return;
    }

    // Delete passwords from the form to prevent malicious attacks
    e.target.elements.password2.value = "";
    e.target.elements.password.value = "";

    //we inited the syncing with true so it has to be stopped
    this.waitForEndSyncing();

    const address = await this.generateEthereumAddress(password);
    this.props.onClose(address)

    this.setState({
      address,
      creationLoading: false
    });
    StorageService.setAccountPassword(address, password)
  }

  /// Return the generated account address0
  async generateEthereumAddress(password: string): Promise<string> {
    return this.props.web3.client.eth.personal.newAccount(password);
  }

  /// Returns false if the local node doesn't sync anymore or
  /// call the given function with the syncing attributes
  async checkSyncing(onSyncing: Function | null = null): Promise<any> {
    return new Promise((resolve, reject) => {
      this.props.web3.client.eth.subscribe('syncing', (error, syncing) => {
        if(error) {
          console.log(`Error at 'syncing' subscription ${error}`)
          reject(error)
          return
        }
        console.log("onSyncing", onSyncing)
        console.log("syncing", syncing)
        if(onSyncing && !syncing) {
          // syncing is false if the local node deosn't sync anymore
          onSyncing(syncing)
        } else {
          resolve(false);
        }
      })
    })
  }

  async waitForEndSyncing(): Promise<void> {
    await this.checkSyncing()
    this.setState({
      syncing: false
    });
  }

  componentDidUpdate() {

  }

  async getSnapshotBeforeUpdate(prevProps, prevState) {
    if(this.props.showModal !== this.state.showModal && !this.state.showModal) {
      this.setState({
        showModal: this.props.showModal,
        showWelcome: this.props.firstAccount
      });
    }
  }

  render() {
    return (
      <>
      <Modal show={this.state.showModal} onHide={this.handleClose} keyboard={false} backdrop='static'>

        <Modal.Header style={{display: !this.state.showWelcome ? '' : 'none'}} closeButton>
          <Modal.Title>Create Ethereum Address</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div>
            <div style={{display: this.state.showWelcome ? '' : 'none'}}>
              <h1 className="text-center">Welcome to Purity!</h1>
              With the Purity you can use the technologies of the new Internet. All of the functionalities happen in a decentralized way. Therefore the application
              started your own Ethereum and IPFS node on your computer to connect to the decentralized Internet.<br/>
              First, you have to create your identification on this network, which will be your Ethereum address, wherewith you can log in to dApp sites, get coins or send them.
            </div>
            <div style={{marginTop: 12}}>
              <Form onSubmit={this.createAddress} className="clearfix" style={{display: !this.state.address && !this.state.creationLoading ? '' : 'none'}}>
                  <div className="inputGroup">
                    <div>Ethereum address password</div>
                    <Form.Control name="password" type="password"/>
                    <div className="description">
                      For the Ethereum Address creation you should give its password, which will be asked every time when you perform action on the network.
                    </div>
                  </div>

                  <div className="inputGroup">
                    <div>Repeat the password</div>
                    <Form.Control name="password2" type="password"/>
                    <ErrorMessage show={this.state.passwordError} message="The two passwords don't match." />
                  </div>

                  <Button className="float-right noBorder" style={{marginTop: 12}} type="submit">Create</Button>
              </Form>

              <Loading loading={this.state.creationLoading} />

              <div className="marginTop" style={{display: this.state.address ? '' : 'none'}}>
                <div>
                  You successfully created the Ethereum account.
                  <div className="font-weight-bold marginTop marginBottom text-center">
                    {this.state.address}
                  </div>
                  <div className="warning">
                    Without the password you can't use this account, and you can't retrieve your coins.
                  </div>
                </div>

                <div className="marginTop" style={{display: this.state.showWelcome ? '' : 'none'}}>
                  <Loading loading={this.state.syncing} />
                  <div className="marginTop">
                    <div className="font-weight-bold warning" style={{display: this.state.syncing ? '' : 'none'}}>
                      Your Ethereum local node is syncing to catch up with its network.
                      It can take several minutes before you can browse on the Purity.
                    </div>
                    <div className="font-weight-bold" style={{display: !this.state.syncing ? '' : 'none'}}>
                      Your Ethereum local node has synced to the other nodes!
                      Now you can close this modal and start browsing on Purity.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Modal.Body>

        <Modal.Footer style={{display: !this.state.showWelcome || this.state.address ? '' : 'none'}}>
          <Button disabled={this.state.showWelcome && this.state.syncing} variant="secondary" onClick={() => this.setState({showModal: false})}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    );
  }
}
