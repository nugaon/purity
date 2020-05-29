import React from 'react';
import { ReactNotificationHandler } from '../services/notifications';
import { Modal, Form, Button, ProgressBar } from 'react-bootstrap';
import { ExtendedWeb3Client, ContentType, FileProtocol } from "../IApp";
import "../App.css";
import "./ClientAddress.css";
import { FaFileUpload } from "react-icons/fa";
import { IpfsClient } from "../services/Ipfs";
import { Environment } from "../environments/Environment";
import { default as ContentChannel } from "../contracts/ContentChannel";
import recognizeContentType from "../services/recognizeContentType";
import { PremiumContentService } from "../services/PremiumContentService";
import { generateRandomString } from "../services/generateRandomString";
import { generateP2pLink } from "../services/generateP2pLink";
// import { FileReader } from "filereader";
import CryptoJS from "crypto-js";
import Loading from "../texts/Loading";

interface Props {
  contentChannel: ContentChannel;
  web3: ExtendedWeb3Client;
}

interface State {
  showModal: boolean;
  isDirectory: boolean;
  uploadStarted: boolean;
  uploading: boolean;
  uploadedUri: string;
  uploadedFilePercents: number;
  chosenFiles: any;
  summary: string;
  isPremium: boolean;
  isEncrypted: boolean;
  encryptionKey: string;
  encryptedContentId: string;
  uploadedContentId: string;
  encryptedUri: string;
  labelSuggestions: Array<string>;
  loading: boolean;
  uploadType: UploadType;
  disableUploadType: boolean;
  disableSummary: boolean;
  disableIsPremium: boolean;
  disableIsEncrypted: boolean;
  contentLabel: string;
}

enum UploadType {
  CONSTANT,
  MUTABLE
}

interface ExtendedFile extends File {
  webkitRelativePath: string
}

export class FileUploading extends React.Component<Props, State, any> {

  ipfs: IpfsClient;
  ipfsGateway: string;
  uploadForm: any;

  constructor(props: Props) {
    super(props);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.handleDirectoryCheckbox = this.handleDirectoryCheckbox.bind(this);
    this.saveToIpfs = this.saveToIpfs.bind(this);
    this.saveFolderToIpfs = this.saveFolderToIpfs.bind(this);
    this.handlePremiumCheckbox = this.handlePremiumCheckbox.bind(this);
    this.handleEncryptCheckbox = this.handleEncryptCheckbox.bind(this);
    this.labelChange = this.labelChange.bind(this)

    this.ipfs = new IpfsClient();
    this.ipfsGateway = Environment.defaultValues.ipfsGateway;

    this.state = this.getDefaultStateObject();
  }

  getDefaultStateObject(): State {
    return {
      showModal: false,
      isDirectory: false,
      uploadedUri: "",
      uploadedFilePercents: 0,
      uploadStarted: false,
      chosenFiles: [],
      summary: "",
      isPremium: false,
      isEncrypted: false,
      encryptionKey: "",
      encryptedContentId: "",
      uploadedContentId: "",
      encryptedUri: "",
      labelSuggestions: [],
      uploading: false,
      loading: false,
      uploadType: UploadType.CONSTANT,
      disableUploadType: false,
      disableSummary: false,
      contentLabel: '',
      disableIsPremium: false,
      disableIsEncrypted: false,
    };
  }

  handleClose() {
    this.uploadForm.reset();
    this.setState(this.getDefaultStateObject());
  }

  handleShow() {
    this.setState({
      ...this.getDefaultStateObject(),
      showModal: true
    });
  }

  componentDidUpdate() { }

  async getSnapshotBeforeUpdate(prevProps: Props, prevState: State) {
    if(!prevState.showModal && this.state.showModal) {
      const contentChannel = this.props.contentChannel;
      // update subscribers with their keys of the channel
      await contentChannel.fetchSubscribersWithKeys();
      //update contentChannel labels
      await contentChannel.fetchContentLabels();
      this.setState({
        labelSuggestions: contentChannel.getContentLabels().slice(1, contentChannel.getContentLabels().length) //remove ALL from the array
      });
    }
  }

  addDirectoryToInput(node) {
    if (node) {
      node.directory = true;
      node.webkitdirectory = true;
    }
  }

  async handleFileUpload(event) {
    event.stopPropagation();
    event.preventDefault();
    const files = event.target.elements.uploadFile.files;
    const folder = event.target.elements.uploadFolder.files;
    const summary = event.target.elements.summary.value;
    const contentLabel = event.target.elements.contentLabel.value;
    const uploadType: UploadType = this.state.uploadType
    //if disableUploadType true, then it is already a used label
    const disableUploadType = this.state.disableUploadType

    this.setState({
      uploadStarted: true,
      uploading: true,
    });

    const protocol: FileProtocol = uploadType === UploadType.CONSTANT ? FileProtocol.IPFS : FileProtocol.IPNS
    const key: string = this.state.encryptionKey;
    const contentSummary: string = summary ? summary : "";
    let contentId = "";
    let contentType: ContentType = ContentType.UNDEFINED;
    try {
      if (this.state.isDirectory) {
        //in case of directory
        contentType = recognizeContentType(folder);
        contentId = await this.saveFolder(folder, protocol);
      } else {
        //in case of a single file
        contentType = recognizeContentType(files);
        if(this.state.isEncrypted) {
          contentId = await this.saveFile(files, protocol, key);
        } else {
          contentId = await this.saveFile(files, protocol);
        }
      }
    } catch(e) {
      this.setState(this.getDefaultStateObject());
      ReactNotificationHandler.addNotification({
        title: "Upload Content",
        message: `Upload content has been failed. Check conntection settings to IPFS`,
        type: "warn"
      });
      return;
    }

    console.log("uploadContentId", contentId)

    //Create encrypted premium contentType (protocolized data which helps to encrypt the EP)
    if(this.state.isPremium) {
      contentId = await this.encryptRealAddress(contentId);
      if(this.state.isEncrypted) {
        contentType = ContentType.ENCRYPTED_PREMIUM;
      } else {
        contentType = ContentType.PREMIUM;
      }
    }

    //publish contentId if it is necessary
    if(this.state.uploadType === UploadType.MUTABLE) {
      contentId = await this.publishAddressUnderLabel(contentId, protocol)
    }

    if(!(protocol === FileProtocol.IPNS && disableUploadType)) {
      //if disableUploadType true, then it is already a used label
      const hash = await this.props.contentChannel.uploadSubscriberContent(contentId, protocol, contentType, contentSummary, contentLabel);
      console.log(`Uploaded content ot transaction ${hash}`);
    }

    const uploadedUri = await generateP2pLink(
      protocol,
      contentType,
      contentId
    )
    this.setState({
      encryptedUri: uploadedUri,
      uploadedContentId: contentId,
      uploadedFilePercents: 100,
      uploadedUri: uploadedUri,
      encryptedContentId: contentId,
      uploading: false,
    });

    // this.handleClose();
  }

  /// Returns the hash of the folder
  private async saveFolder(
    files: Array<ExtendedFile>,
    protocol: FileProtocol
  ): Promise<string> {
    const file = files[0];
    const { path, webkitRelativePath } = file;
    const folderName = webkitRelativePath.substring(0, file.webkitRelativePath.indexOf("/"))
    const folderPath = path.substring(0, path.search(folderName) + folderName.length)
    if(protocol === FileProtocol.IPFS
      || protocol === FileProtocol.IPNS) {

      return this.saveFolderToIpfs(folderPath)
    } else {
      //TODO
      throw Error("not implemented")
    }
  }

  private async saveFile(
    files: Array<File>,
    protocol: FileProtocol,
    encryptionKey?: string
  ): Promise<string> {
    if(protocol === FileProtocol.IPFS
      || protocol === FileProtocol.IPNS) {
      return this.saveToIpfs(files[0].path, encryptionKey)
    } else {
      //TODO
      throw Error("not implemented")
    }
  }

  /// Publish content hash under the given label for the content
  /// MUTABLE contents
  private async publishAddressUnderLabel(contentId: string, protocol: FileProtocol): Promise<string> {
    //in case of mutable content we have to publish the CID
    if(this.state.uploadType !== UploadType.MUTABLE) {
      throw Error(`Error at publishing content address: Wront uploadType given
      ${this.state.uploadType}`)
    }
    if(protocol === FileProtocol.IPFS
      || protocol === FileProtocol.IPNS) {
      return this.ipfs.publishHash(contentId, this.state.contentLabel)
    } else {
      throw new Error(`Not implemented`)
    }
  }

  // Return encrypted content id
  private async encryptRealAddress(contentAddress: string): Promise<string> {
    const csv: string = await PremiumContentService.hideRealContentAddress(this.props.contentChannel.subscribers, contentAddress);
    const filename = `premiumInfo-${contentAddress}.csv`
    return this.ipfs.addString(filename, csv)
  }

  async saveToIpfs(filePath: string, encryptionKey?: string): Promise<string> {
    return this.ipfs.add(filePath)
  }

  /// Only can choose one directory, so this function just passes the files' root folder
  async saveFolderToIpfs(folderPath: string): Promise<string> {
    console.log("folderPath", folderPath)
    return this.ipfs.addFolder(folderPath)
  }

  handleDirectoryCheckbox() {
    this.setState({
      isDirectory: !this.state.isDirectory
    });
  }

  handlePremiumCheckbox() {
    this.setState({
      isPremium: !this.state.isPremium
    })
  }

  handleEncryptCheckbox() {
    this.setState({
      isEncrypted: !this.state.isEncrypted,
      encryptionKey: generateRandomString(32),
    });
  }

  async labelChange(e: React.ChangeEvent<HTMLInputElement>) {
    let disableIsPremium = false
    let disableIsEncrypted = false
    let disableUploadType = false
    let isPremium = false
    let isEncrypted = false
    this.setState({
      loading: true,
      summary: '',
      disableSummary: false,
      disableUploadType,
      disableIsPremium,
      disableIsEncrypted,
      isPremium,
      isEncrypted
    })
    const label = e.currentTarget.value
    let existingSummary = ''
    let uploadType: UploadType = UploadType.CONSTANT
    if(this.state.labelSuggestions.some(labelSuggestion => labelSuggestion === label)) {
      disableUploadType = true
      const contentChannel = this.props.contentChannel
      const labelContentIndexes = await contentChannel.getLabelledContentIndexes(label);
      const firstLabelContentIndex = labelContentIndexes[0]
      if (labelContentIndexes.length === 1) {
        //the mutable content only has one item under the label, but has to be checked
        //the content itself is mutable or not
        const content = await contentChannel.getContent(firstLabelContentIndex)
        console.log("content", content)
        if(content.protocol === FileProtocol.IPNS) {
          existingSummary = content.summary ? content.summary : ''
          uploadType = UploadType.MUTABLE
        }
        //at mutablecontent it has to be locked for upload premium content
        isPremium = ContentType.PREMIUM === +content.contentType
          || ContentType.ENCRYPTED_PREMIUM === +content.contentType
        isEncrypted = ContentType.ENCRYPTED_PREMIUM === +content.contentType
        disableIsPremium = true
        disableIsEncrypted = true
      }
    }
    this.setState({
      loading: false,
      disableSummary: existingSummary !== '', //only at mutable contents
      uploadType,
      summary: existingSummary ? existingSummary : this.state.summary,
      contentLabel: label,
      isPremium,
      isEncrypted,
      disableUploadType,//if the label existed before can't change its upload type
      disableIsPremium,
      disableIsEncrypted
    })
  }

  render() {
    const labelSuggestionsDom = this.state.labelSuggestions.map(label => {
      return (
        <option key={label} value={label} />
      );
    });

    // <div style={{display: this.state.uploadStarted ? '' : 'none' }}>
      // <ProgressBar now={this.state.uploadedFilePercents} label={`${this.state.uploadedFilePercents}%`} />
    // </div>
    return (
      <>
      <span className="clickable dot" onClick={this.handleShow}><FaFileUpload /></span>

      <Modal show={this.state.showModal} onHide={this.handleClose}>
      <form ref={(el) => this.uploadForm = el} onSubmit={ this.handleFileUpload }>

        <Modal.Header closeButton>
          <Modal.Title>{ this.props.contentChannel.channelName } Upload</Modal.Title>
        </Modal.Header>

        <Modal.Body className="marginBottomForChildren">
          <div style={{display: !this.state.uploadStarted ? '' : 'none' }} >
            <Form.Check type="checkbox" name="isDirectory" label="I would like to upload a directory" onChange={this.handleDirectoryCheckbox} defaultValue={this.state.isDirectory.toString()}/>
            <input
              type='file'
              style={{display: !this.state.isDirectory ? '' : 'none'}}
              name="uploadFile"
              onChange={e => {
                console.log("e", e);
                this.setState({ chosenFiles: e.currentTarget.files });
              }}
            />
            <input
              type='file'
              style={{display: this.state.isDirectory ? '' : 'none'}}
              ref={node => this.addDirectoryToInput(node)}
              name="uploadFolder"
              onChange={e => this.setState({ chosenFiles: e.currentTarget.files })}
            />
            <div className="inputGroup">
              <div>Label</div>
                <Form.Control
                  list="labels" name="contentLabel" onChange={this.labelChange}
                />
                <datalist id="labels">
                  {labelSuggestionsDom}
                </datalist>
              <div className="description">
                You can label your Content to group similar Content together.
              </div>
            </div>

            <div className="radio">
              <label>
                <input
                  name="uploadType"
                  type="radio"
                  value={UploadType.CONSTANT}
                  checked={this.state.uploadType === UploadType.CONSTANT}
                  disabled={this.state.disableUploadType}
                  onChange={(e) => this.setState({ uploadType: +e.currentTarget.value})}
                />
                &nbsp;Constant
              </label>
            </div>
            <div className="radio">
              <label>
                <input
                  name="uploadType"
                  type="radio"
                  value={UploadType.MUTABLE}
                  checked={this.state.uploadType === UploadType.MUTABLE}
                  disabled={this.state.disableUploadType}
                  onChange={(e) => this.setState({ uploadType: +e.currentTarget.value})}
                />
                &nbsp;Mutable
              </label>
            </div>

            <div className="inputGroup">
              <div>
                Brief content summary
              </div>
              <Form.Control
                type="text" name="summary"
                onChange={e => this.setState({ summary: e.currentTarget.value})}
                disabled={this.state.disableSummary}
                value={this.state.summary}
                required
              />
              <div className="description">
                Write some description about the Content.
              </div>
            </div>

            <Form.Check
              type="checkbox"
              name="isPremium"
              label="I would like to upload content for my current Premium Users"
              onChange={this.handlePremiumCheckbox}
              checked={this.state.isPremium}
              disabled={this.state.disableIsPremium}
            />
            <div style={{display: this.state.isPremium ? '' : 'none'}}>
              <div style={{display: this.state.encryptedContentId !== "" ? '' : 'none'}}>
                The Content ID, which hides the upper Content ID is: <a target="external-content" rel="noopener noreferrer" href={this.state.encryptedUri } >{this.state.encryptedContentId}</a>
              </div>
            </div>

            <Form.Check
              type="checkbox"
              style={{display: this.state.isPremium ? '' : 'none'}}
              name="isEncrypted"
              label="I would like to encrypt the uploading data"
              onChange={this.handleEncryptCheckbox}
              checked={this.state.isEncrypted}
              disabled={this.state.disableIsEncrypted}
            />
          </div>
          <div style={{display: this.state.uploadedUri !== "" ? '' : 'none'}}>
            Your Uploaded Content ID is: <a target="external-content" rel="noopener noreferrer" href={this.state.uploadedUri } >{this.state.uploadedContentId}</a>
          </div>

          <div style={{display: this.state.isEncrypted ? '' : 'none'}}>
            The content will be encrypted with the following key: <br />
            <b>{this.state.encryptionKey}</b>
          </div>

          <Loading loading={this.state.uploading} />

        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={this.handleClose}>
            Close
          </Button>
          <Button
            disabled={
              this.state.uploadedUri !== ""
            || this.state.chosenFiles.length === 0
            || this.state.summary === ""
            || this.state.loading
            || this.state.uploadStarted
          }
            variant="primary"
            type="submit"
            value="Submit"
          >
            Upload
          </Button>
        </Modal.Footer>
      </form>
      </Modal>
      </>
    );
  }
}
