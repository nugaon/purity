import React, { useState } from 'react';
import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { OverlayTrigger, Tooltip, Container, Row, Col, Form, Button } from 'react-bootstrap';
import AnimatedNumber from 'animated-number-react';
import { ExtendedWeb3Client } from "../IApp";
import { ReactNotificationHandler } from '../services/notifications';
import { useParams } from "react-router";
import { FaRegEdit, FaRegCheckSquare } from "react-icons/fa";
import {shell, ipcRenderer} from "electron";
import { StorageService } from "../services/StorageService";

interface State {
  to: string;
  value: number;
  data: string | undefined;
  editTo: boolean;
  editingTo: string;
  editValue: boolean;
  editingValue: number;
  showSection: "details" | "data";
  gasFee: number;
  editingGasFee: number;
}

interface Props {
  web3: ExtendedWeb3Client;
  netType: "main" | "test" | undefined
}

function SendTransaction(props: Props) {

  let {popupId, to, value, data } = useParams();
  console.log("useparams", useParams())
  if(typeof popupId !== "string") {
    throw Error('The SendTransaction modal has to have popupId')
  }
  if(value === "undefined") {
    value = undefined
  }
  if(data === "undefined") {
    data = undefined
  }
  if(to === "undefined") {
    to = undefined
  }

  let setTo, setValue;
  [to, setTo] = useState(to);
  const [editTo, setEditTo] = useState(!!to ? false : true);
  const [editingTo, setEditingTo] = useState(to ? to : "");
  [value, setValue] = useState(value ? value : "0");
  const [editValue, setEditValue] = useState((value && value !== "0") || data !== undefined ? false : true);
  const [editingValue, setEditingValue] = useState(value);
  const [gasFee, setGasFee] = useState(props.web3.client.utils.fromWei(
    props.web3.transactionOptions.gasPrice ?
    props.web3.transactionOptions.gasPrice :
    props.web3.client.utils.toWei("20", "Gwei")
  ))
  const [editGasFee, setEditGasFee] = useState(false);
  const [editingGasFee, setEditingGasFee] = useState(gasFee);
  const [showSection, setShowSection] = useState("details");
  const [txId, setTxId] = useState("");
  const [loading, setLoading] = useState(false)

  const handleSetTo = () => {
    const isAddress: boolean = props.web3.client.utils.isAddress(editingTo);
    if (!isAddress) {
      ReactNotificationHandler.addNotification({
        title: "Wrong address",
        message: `The given recipient is not a valid address.`,
        type: "warn"
      });
      return;
    }
    setTo(editingTo);
    setEditTo(false);
  }

  const handleSetValue = ()  => {
    setValue(editingValue)
    setEditValue(false);
  }

  const setGas = () => {
    setGasFee(editingGasFee);
    setEditGasFee(false)
  }

  const addEthers = (value1: string, value2: string): string => {
    const wei1 = props.web3.client.utils.toBN(props.web3.client.utils.toWei(value1))
    const wei2 = props.web3.client.utils.toBN(props.web3.client.utils.toWei(value2))
    return props.web3.client.utils.fromWei(wei1.add(wei2));
  }

  const handleKeyPress = (e, f: Function) => {
    if(e.key === "Enter") {
      f()
    }
  }

  const onTransactionHistoryClick = (address: string) => {
    shell.openExternal(`https://${props.netType == 'test' ? 'rinkeby.' : ''}etherscan.io/address/${address}`)
  }

  const onTxIdClick = (txId: string) => {
    shell.openExternal(`https://${props.netType == 'test' ? 'rinkeby.' : ''}etherscan.io/tx/${txId}`)
  }

  const cancel = () => {
    ipcRenderer.send('result-sendtransaction-popup', {popupId, result: "canceled"})
    window.close()
  }

  const confirm = async () => {
    setLoading(true)
    let transactionOptions = {
      from: props.web3.transactionOptions.from,
      gasPrice: props.web3.client.utils.toWei(gasFee),
      to
    }
    if(data) {
      transactionOptions['data'] = data
    }
    if(value !== "0") {
      transactionOptions['value'] = props.web3.client.utils.toWei(value)
    }
    const passwordObject = StorageService.getAccountPassword();
    if(!passwordObject) {
      throw Error(`The account ${transactionOptions.from} doesn't have password`)
    }
    const password = passwordObject[transactionOptions.from];
    if(!password) {
      ReactNotificationHandler.addNotification({
        title: "Wrong password",
        message: `The cached password belongs to other account`,
        type: "warn"
      });
      return;
    }
    const txId = await props.web3.client.eth.personal.sendTransaction(transactionOptions, password)
    setTxId(txId)
    ipcRenderer.send('result-sendtransaction-popup', {popupId, txId, result: "success"})
    console.log('transactionId', txId);
    //TODO
  }

  return (
    <Form>
      <Container>
        <div style={{marginBottom: 42}}>
          <div>
            <div>
              <span className="font-weight-bold">From</span>
            </div>
            <div>
              <a
                className="clickable"
                onClick={() => onTransactionHistoryClick(props.web3.transactionOptions.from)}>
                {props.web3.transactionOptions.from}
              </a>
            </div>
          </div>
          <div>
            <div>
              <span className="font-weight-bold">To</span>&nbsp;
              <span hidden={editTo}><FaRegEdit onClick={() => setEditTo(true) }/></span>
              <span hidden={!editTo}><FaRegCheckSquare onClick={handleSetTo}/></span>
            </div>
            <div hidden={!editTo}>
              <input
                style={{width: 360}}
                name="to"
                defaultValue={to}
                onKeyPress={(e) => handleKeyPress(e, handleSetTo)}
                onChange={(e) => setEditingTo(e.target.value) }
                type="text"
              />
            </div>
            <div hidden={editTo}>
              <a
                className="clickable"
                onClick={() => onTransactionHistoryClick(to)}
              >
                {to}
              </a>
            </div>
          </div>
        </div>

        <div className="marginBottom" hidden={!data}>
          <Row style={{margin: 1}}>
            <Col
              className={"mainButtons clickable justify-content-center" + (showSection === "details" ? " mainButtonActive" : "")}
              onClick={() => setShowSection("details")}
            >
              <span>
                Details
              </span>
            </Col>
            <Col
              className={"mainButtons clickable justify-content-center" + (showSection === "data" ? " mainButtonActive" : "")}
              onClick={() => setShowSection("data") }
            >
              <div style={{flexWrap: 'wrap'}}>
                Data
              </div>
            </Col>
          </Row>
        </div>

        <div hidden={showSection != 'details'} className="marginBottomForChildren">
          <Row>
            <Col style={{textAlign: "left"}}>
              <span>Sending Value</span>&nbsp;
              <span hidden={!editValue}><FaRegCheckSquare onClick={handleSetValue}/></span>
              <span hidden={editValue}><FaRegEdit onClick={() => setEditValue(true) }/></span>
            </Col>
            <Col style={{textAlign: "right"}}>
              <div hidden={editValue} className="mainFontColor">
                <AnimatedNumber
                  value={value}
                  duration={800}
                  formatValue={n => parseFloat(n).toFixed(10)}
                />
                  &nbsp;<span className="currency">ETH</span>
              </div>
              <div className="align-middle" style={{textAlign: "right"}} hidden={!editValue}>
                <input
                  name="askedValue"
                  className="w-100"
                  style={{ textAlign: 'right', paddingRight: 2 }}
                  defaultValue={value}
                  onKeyPress={(e) => handleKeyPress(e, handleSetValue)}
                  onChange={ (e) => setEditingValue(e.target.value) }
                  type="text"/>
              </div>
            </Col>
          </Row>

          <Row className="receiptDetails">
            <Col style={{textAlign: "left"}}>
              <span>Transaction fee</span>&nbsp;
              <span hidden={!editGasFee}><FaRegCheckSquare onClick={setGas}/></span>
              <span hidden={editGasFee}><FaRegEdit onClick={() => setEditGasFee(true) }/></span>
            </Col>
            <Col style={{textAlign: "right"}}>
              <div>
                <span hidden={editGasFee} className="mainFontColor">
                  <AnimatedNumber
                    value={gasFee}
                    duration={800}
                    formatValue={n => parseFloat(n).toFixed(10)}
                  />
                    &nbsp;<span className="currency">ETH</span>
                </span>
                <span hidden={!editGasFee}>
                  <input
                    name="gasFee"
                    className="w-100"
                    style={{ textAlign: 'right', paddingRight: 2 }}
                    defaultValue={gasFee}
                    onChange={(e) => setEditingGasFee(e.target.value) }
                    onKeyPress={(e) => handleKeyPress(e, setGas)}
                    type="number"
                  />
                </span>
              </div>
            </Col>
          </Row>

          <Row className="receiptDetails">
            <Col style={{textAlign: "left"}}>
              Total
            </Col>
            <Col style={{textAlign: "right"}}>
            <span className="mainFontColor">
              <AnimatedNumber
                value={
                  addEthers(value, gasFee)
                }
                duration={800}
                formatValue={n => parseFloat(n).toFixed(10)}
              />
                &nbsp;<span className="currency">ETH</span>
            </span>
            </Col>
          </Row>
        </div>

        <div hidden={showSection != 'data'} className="marginBottomForChildren">
          <Row>
            <Col style={{textAlign: "left"}}>
              <span>Data</span>
            </Col>
            <Col style={{textAlign: "right", wordWrap: 'break-word'}}>
              <span>
                {data}
              </span>
            </Col>
          </Row>
        </div>

        <div hidden={txId === ""}>
          The transaction has been accepted.<br />
          <a className="clickable" onClick={() => onTxIdClick(txId)}>Click here to see it's history</a>
        </div>

        <div style={{textAlign: "right", marginTop: 12}}>
          <Button style={{marginRight: 12}} className="regularButton" variant="secondary" onClick={cancel}>Cancel</Button>
          <Button disabled={editTo || editValue || editGasFee || txId !== "" || loading} className="regularButton" onClick={confirm}>Confirm</Button>
        </div>
      </Container>
    </Form>
  );
}

export default SendTransaction;
