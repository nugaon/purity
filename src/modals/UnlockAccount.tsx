import React, { useState, useEffect, useRef } from 'react';
import { ExtendedWeb3Client } from "../IApp";
import { OverlayTrigger, Tooltip, Modal, Form, Button } from 'react-bootstrap';
import "../App.css";
import Loading from "../texts/Loading";
import { ReactNotificationHandler } from '../services/notifications';
import { StorageService } from "../services/StorageService";

interface Props {
  showModal: boolean;
  onClose: Function;
  web3: ExtendedWeb3Client;
}

export function UnlockAccount(props: Props) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [init, setInit] = useState(false)

  useEffect(() => {
    if(init) {
      return;
    }
    //remove account passphrase after close main window
    window.addEventListener("beforeunload", (ev) =>
    {
      StorageService.deleteAccountPasswords()
    });
    setInit(true)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const password = e.target.elements.password.value
    const address = props.web3.transactionOptions.from
    try {
      const unlocked = await props.web3.client.eth.personal.unlockAccount(address, password, 0)
      if(!unlocked) {
        throw new Error("Bad password.")
      }
      StorageService.setAccountPassword(address, password)
    } catch(e) {
      ReactNotificationHandler.addNotification({
        title: "Unlocking failure",
        message: `The account unlocking wasn't successful ${e.message}`,
        type: "warn"
      });
      setLoading(false)
      return;
    }
    setLoading(false)
    props.onClose()
  }

  useEffect(() => {
    if(props.showModal !== showModal) {
      setShowModal(props.showModal)
    }
  });

  return (
    <Modal show={showModal} keyboard={false} backdrop='static'>
      <Form className="clearfix" onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title>Unlock Account</Modal.Title>
        </Modal.Header>

        <Modal.Body className="marginBottomForChildren">

          <div>
            In order to use the blockchain you must give your active account's password.<br />
            Only time when it is necessary at application startup and account change.<br />
            Any other cases don't share your password!
          </div>

          <div className="inputGroup">
            <div>Password</div>
            <input name="password" type="password" />
          </div>

          <Loading loading={loading}/>

        </Modal.Body>

        <Modal.Footer>
          <Button className="regularButton" disabled={loading} type="submit">
            Authenticate
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
