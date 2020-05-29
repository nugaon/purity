import React from 'react';
import { StorageService } from "../services/StorageService";
import { Modal, Form, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaMoneyBillWave } from "react-icons/fa";
import "./ClientAddress.css";
import ContentChannel from "../contracts/ContentChannel";
import PurityWeb from "../contracts/PurityWeb";
import { ExtendedWeb3Client } from "../IApp";
import { initPurityWebInstance } from "../services/initPurityWebInstance";
import { Web3Helper } from "../services/Web3Helper";

interface Props {
  contentChannel: ContentChannel;
  onChannelPriceChange: Function;
  web3: ExtendedWeb3Client;
}

interface State {
  clientAddress: string;
  showModal: boolean;
  enoughFounds: boolean;
  loading: boolean;
  transactionFeeInEther: number;
  summaryResultInEther: number;
}


/// At first load not necessary to load anything because it will be hidden and will be rerendered;
export class SendChannelCoins extends React.Component<Props, State> {

  private purityWeb: PurityWeb;

  constructor(props: Props) {
    super(props);
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleSendChannelCoins = this.handleSendChannelCoins.bind(this);
    this.feeCalculation = this.feeCalculation.bind(this);

    this.purityWeb = initPurityWebInstance(this.props.web3);

    this.state = {
      clientAddress: "",
      showModal: false,
      transactionFeeInEther: 0,
      summaryResultInEther: 0,
      enoughFounds: false,
      loading: true,
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

    this.feeCalculation();
  }

  async handleSendChannelCoins(e) {
    e.preventDefault();
    e.target.reset();

    const txId = await this.props.contentChannel.withdrawBalance();
    const web3Helper = new Web3Helper(this.props.web3)
    await web3Helper.waitForTransactionSuccess(txId)
    this.props.onChannelPriceChange(this.props.contentChannel)

    this.setState({
      showModal: false
    });
  }

  async feeCalculation() {
    const subscriptionBalanceInWei = this.props.web3.client.utils.toBN(this.props.web3.client.utils.toWei(this.props.contentChannel.balance));
    const purityNetFeeInPercents = await this.purityWeb.getWithdrawFee();
    const purityNetFeeInWei = subscriptionBalanceInWei.div(this.props.web3.client.utils.toBN(100)).mul(this.props.web3.client.utils.toBN(purityNetFeeInPercents));
    const estimateGasPriceInWei = this.props.web3.client.utils.toBN(await this.props.contentChannel.withdrawBalanceGas())
      .mul(this.props.web3.client.utils.toBN(StorageService.getGasPrice()))
      .add(purityNetFeeInWei);
    const transactionFeeInEther = +this.props.web3.client.utils.fromWei(estimateGasPriceInWei);
    const ownBalance = await this.props.web3.client.eth.getBalance(this.props.web3.transactionOptions.from);
    const summaryResultInEther = +this.props.web3.client.utils.fromWei(this.props.web3.client.utils.toBN(this.props.web3.client.utils.toWei(this.props.contentChannel.balance)).sub(estimateGasPriceInWei));
    const userBalanceWithoutFee: number = +this.props.web3.client.utils.fromWei(this.props.web3.client.utils.toBN(ownBalance).sub(estimateGasPriceInWei));
    const enoughFounds = userBalanceWithoutFee > 0;
    this.setState({
      enoughFounds: enoughFounds,
      transactionFeeInEther: transactionFeeInEther,
      summaryResultInEther: summaryResultInEther,
      loading: false,
    });
  }

  render() {

    return (
      <>
        <OverlayTrigger
          key="bottom"
          placement="bottom"
          overlay={
            <Tooltip id="tooltip-search">
              Send Coins to Current Client Address
            </Tooltip>
          }
        >
          <span className="clickable dot" onClick={this.handleShow}><FaMoneyBillWave /></span>
        </OverlayTrigger>

        <Modal className="listBox" show={this.state.showModal} onHide={this.handleClose}>
        <Form onSubmit={ this.handleSendChannelCoins }>

        <Modal.Header closeButton>
          <Modal.Title>Withdraw Channel Balance to Client Address</Modal.Title>
        </Modal.Header>
        <Modal.Body className="marginBottomForChildren">
          <div>
            Content Channel '{this.props.contentChannel.channelName}' currently has balance:<br />
            <span>{this.props.contentChannel.balance} <span className="currency">ETH</span></span><br/>
            <p style={{display: this.state.loading ? 'none' : ''}}>
              The transaction fee is:<br />
              <span>{this.state.transactionFeeInEther} <span className="currency">ETH</span></span><br/>
              You can get:<br />
              <span>{this.state.summaryResultInEther} <span className="currency">ETH</span></span><br/>
            </p>
          </div>
          <p>
            This balance will be sent to your current client address: <br />
            {this.props.web3.transactionOptions.from}
          </p>
          <p style={{display: !this.state.loading && !this.state.enoughFounds ? '' : 'none'}} className="alert alert-danger">
            Not enough founds to perform this transaction!
          </p>
          <p style={{display: this.state.summaryResultInEther <= 0 ? '' : 'none'}} className="alert alert-danger">
            Your balance will be lower if you send this transaction
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button disabled={!this.state.enoughFounds || this.state.summaryResultInEther <= 0} variant="primary" type="submit" value="Submit">
            Send
          </Button>
        </Modal.Footer>
        </Form>
        </Modal>
      </>
    );
  }
}
