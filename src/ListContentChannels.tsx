import React from 'react';
import TimeAgo from "react-timeago";
import { Card, Button, Row, Col } from 'react-bootstrap';
import { default as PurityWeb } from "./contracts/PurityWeb";
import ContentChannel from "./contracts/ContentChannel";
import { generateP2pLink } from "./services/generateP2pLink";
import { Content, FileProtocol, ContentType } from "./IApp";
import { AiOutlineCaretDown, AiOutlineCaretRight, AiOutlineCaretLeft } from "react-icons/ai";
import Loading from "./texts/Loading";
import CryptoJS from "crypto-js";
import FileSaver from "file-saver";
import marked from "marked";
import sanitizeHtml from "sanitize-html";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./ListContentChannels.css";
import "./App.css";

interface Props {
  channelNameOrCategory: string;
  purityWeb: PurityWeb;
  searchCount: number;
}

interface State {
  listChannels: Array<React.ReactNode>;
  hasMoreChannels: boolean;
  loading: boolean;
  newSearchFetching: boolean;
  readMore: { [channelName: string]: boolean };
}

function NextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div onClick={onClick} className={className} style={style} aria-label="next">
      <AiOutlineCaretRight />
    </div>
  );
}

function PrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <div onClick={onClick} className={className} style={style} aria-label="left">
      <AiOutlineCaretLeft />
    </div>
  );
}

export class ListContentChannels extends React.Component<Props, State> {

  private contentFetched: boolean;
  private namedContentChannel: ContentChannel | null; //if the search word appears in a channel name and a type name too, a specific ordering fit for insert the named content channel into the result
  private namedChannelInserted: boolean;
  private channelsInKeyword: Array<ContentChannel>; // search keywords content channels
  private namedTopicLength: number;
  private namedTopicIndex: number; //index for category listing
  private lastChannelIdInCategory: number; //index for category listing
  private listChannelCount: number; //how much channel can be in the result at once.
  private loading: boolean;

  constructor(props: Props) {
    super(props);
    this.fetchContentChannel = this.fetchContentChannel.bind(this);
    this.state = {
      listChannels: [],
      hasMoreChannels: false,
      loading: false,
      newSearchFetching: false,
      readMore: {}
    };
    this.contentFetched = false;
    this.listChannelCount = 3; //default TODO
  }

  async fetchContentChannel(channel: ContentChannel): Promise<void> {
    await channel.fetchContentLabels();
  }

  //init new search
  async getInterestedInChannels(): Promise<void> {
    this.setState({
      loading: true,
      newSearchFetching: true,
    });
    this.contentFetched = true;
    this.namedChannelInserted = false;
    this.lastChannelIdInCategory = 0;
    if(this.props.channelNameOrCategory === "") {
      this.setState({
        listChannels: [],
      });
      return;
    }
    let contentChannels: Array<ContentChannel> = [];

    //search for channel which exactly the search keyword -> insert in the appropiate place
    try {
      const contentChannel: ContentChannel = await this.props.purityWeb.getContentChannelInstance(this.props.channelNameOrCategory);
      await this.fetchContentChannel(contentChannel);

      console.log("contentChannel", contentChannel);
      this.namedContentChannel = contentChannel;
    } catch(e) {
      this.namedContentChannel = null;
      console.log("no channel found", e);
    }

    //search for categories by the search keywords
    let hasMoreChannels: boolean = true;
    try {
      this.namedTopicLength = await this.props.purityWeb.getCategoryLength(this.props.channelNameOrCategory);
      this.namedTopicIndex = this.namedTopicLength;
      this.lastChannelIdInCategory = 0; // from the head;
      console.log("namedTopicLength", this.namedTopicLength);
      if(this.namedTopicLength > 0) {
        const topicChannels = await this.getMoreChannelsInTopic();
        hasMoreChannels = topicChannels.hasMoreChannels;
        contentChannels = contentChannels.concat(topicChannels.contentChannels);
      } else { //only the named channel will be in the results
        hasMoreChannels = false;
        if(this.namedContentChannel && !this.namedChannelInserted) {
          this.insertNamedContentChannel(contentChannels);
        }
      }
    } catch (e) {
      this.namedTopicLength = 0;
      hasMoreChannels = false;
    }

    //in order to fetch more channels in the Category/Topic, we should save the initial channels
    this.channelsInKeyword = contentChannels;

    this.setState({
      listChannels: await this.listChannelsDom(contentChannels),
      hasMoreChannels: hasMoreChannels,
      loading: false,
      newSearchFetching: false,
    });
  }

  async showMoreContents(channelIndex: number) {
    this.channelsInKeyword[channelIndex].needMoreContents();
    await this.refreshChannel(this.channelsInKeyword[channelIndex], channelIndex);
  }

  async refreshChannel(channel: ContentChannel, sequence: number) {
    const channelDom = await this.listChannelDom(channel, sequence);
    const newListChannels: Array<React.ReactNode> = this.state.listChannels;
    newListChannels[sequence] = channelDom;
    this.setState({
      listChannels: newListChannels
    });
  }

  async listChannelDom(channel: ContentChannel, sequence: number): Promise<React.ReactNode> {
    await channel.fetchSubscriberContents();
    const subscriberContentsDom = await this.listSubscriberContentsDom(
      channel.getSubscriberContents()
    );
    const contentLabels = channel.getContentLabels();
    let sliderSettings = {
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      swipeToSlide: true,
      beforeChange: async (oldIndex: number, newIndex: number) => {
        await channel.setActiveContentLabel(contentLabels[newIndex]);
        await this.refreshChannel(channel, sequence);
      },
      nextArrow: <NextArrow />,
      prevArrow: <PrevArrow />
    };
    const contentLabelsDom = contentLabels.map((label: string, i: number) => {
      return(
        <div key={i}>{label}</div>
      );
    });
    const channelName: string = channel.channelName;
    let descriptionClass = "channelDescription"; //TODO for readMore
    return (
        <Card className="channelBody" bg="dark" text="white" key={channelName}>
          <Card.Header className="channelName">
            {channelName}
          </Card.Header>
          <Card.Body>
            <div className={descriptionClass}>
              {channel.description ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked(channel.description))} } /> : <div>'No description'</div> }
            </div>
            <div className="contentLabels">
              <div className="activeLabel"></div>
              <div className="labelList">
                <Slider key={this.props.searchCount + channel.channelName} {...sliderSettings}>
                  {contentLabelsDom}
                </Slider>
              </div>
            </div>
            <div className="channelContents">
              {subscriberContentsDom}
            </div>
            <div>
              <span style={{color: channel.hasContentFetchMore ? 'white' : 'transparent' }} className="clickable" onClick={() => this.showMoreContents(sequence)}><AiOutlineCaretDown /></span>
            </div>
          </Card.Body>
        </Card>
    );
  }

  async listChannelsDom(channels: Array<ContentChannel>): Promise<Array<React.ReactNode>> {
    const domArray: Array<React.ReactNode> = [];
    for (const [i, channel] of channels.entries()) {
      domArray.push(
        await this.listChannelDom(channel, i)
      );
    }
    return domArray;
  }

  private insertNamedContentChannel(contentChannels: Array<ContentChannel>) {
    if(!this.namedContentChannel) {
      return;
    }
    const namedContentChannel = this.namedContentChannel; //for typescript
    const namedContentChannelInArray = contentChannels.filter((contentChannel: ContentChannel) => contentChannel.channelName === namedContentChannel.channelName);
    if(namedContentChannelInArray.length === 0) {
      contentChannels.push(namedContentChannel);
    }
    this.namedChannelInserted = true;
  }

  private async handleContentClickEvent(e, content: Content) {
    console.log("content", content);

    if(+content.contentType === ContentType.ENCRYPTED_PREMIUM) {
      console.log("Encrypted premium content");
      //TODO
      // const ipfs = new IpfsClient();
      // const realAddress: string = await generateP2pLink(FileProtocol.premium, content.contentType, content.fileAddress); //TODO
      // console.log("realAddress", realAddress);
      // const fetchedContent = await ipfs.client.cat(realAddress);
      // this.processEncryptedFile(fetchedContent, "BFxLfX8zMTBqyDTpp8cNMTJJWI5SciXF", "image/jpeg");
    } else {
      const p2pAddress = await generateP2pLink(
        content.protocol,
        content.contentType,
        content.fileAddress
      );
      const win = window.open(p2pAddress, 'external-content');
      if(win) {
        win.focus();
      }
    }
  }

  async listSubscriberContentsDom(contents: Array<Content>): Promise<Array<React.ReactNode>> {
    const domArray: Array<React.ReactNode> = [];
    for (const content of contents) {
      let contentType = "Public Content";
      switch(+content.contentType) {
        case ContentType.PREMIUM:
          contentType = "Premium Content"; break;
        case ContentType.ENCRYPTED_PREMIUM:
          contentType = "Encrypted Premium Content"; break;
      }
      let protocol = "IPFS"
      switch(+content.protocol) {
        case FileProtocol.IPNS:
          protocol = "IPNS"; break
      }
      domArray.push(
        <div className="channelContentListItem" key={content.uploadTime + "|" + content.fileAddress}>
          <a  className="activeLink" onClick={(e) => this.handleContentClickEvent(e, content)}>{content.fileAddress}</a>
          <div>
            <div className="contentMeta">
              {contentType} {protocol}
            </div>
            {content.summary}<br />
            <TimeAgo className="timegago" date={new Date(content.uploadTime * 1000)} />
          </div>
          <div className="divider" style={{marginTop: 12}}></div>
        </div>
      );
    }
    return domArray;
  }

  componentDidUpdate() {

  }

  async getSnapshotBeforeUpdate(prevProps, prevState) {
    if(this.props.searchCount > prevProps.searchCount) {
      await this.getInterestedInChannels();
    }
  }

  async showMoreChannelsInTopic() {
    this.setState({
      loading: true,
    });
    const topicChannels = await this.getMoreChannelsInTopic();
    this.channelsInKeyword = this.channelsInKeyword.concat(topicChannels.contentChannels);

    this.setState({
      hasMoreChannels: topicChannels.hasMoreChannels,
      listChannels: await this.listChannelsDom(this.channelsInKeyword),
      loading: false
    });
  }

  async getMoreChannelsInTopic(): Promise<{hasMoreChannels: boolean, contentChannels: Array<ContentChannel>}> {
    let hasMoreChannels = true;
    const contentChannels: Array<ContentChannel> = [];
    const pageSize = 3;

    const channelAddresses: Array<string> = await this.props.purityWeb.getChannelsFromCategories(this.props.channelNameOrCategory, this.lastChannelIdInCategory, pageSize);
    for(const channelAddress of channelAddresses) {
      const contentChannel: ContentChannel = await this.props.purityWeb.initContentChannelInstanceFromAddress(channelAddress);
      await this.fetchContentChannel(contentChannel);

      //if the namedContentChannel has more subscriptions than the topicChannel then insert the namedChannel before the topicChannel.
      if(
        this.namedContentChannel
        && !this.namedChannelInserted
        && this.namedContentChannel.subscriptionCount > contentChannel.subscriptionCount
      ) {
        this.insertNamedContentChannel(contentChannels);
      }

      --this.namedTopicIndex;
      contentChannels.push(contentChannel);
      this.lastChannelIdInCategory = contentChannel.channelId;

      if(this.namedTopicIndex < this.namedTopicLength && this.namedTopicIndex === 0) {
        hasMoreChannels = false;

        //if during the inserting topicChannels the namedChannel has not been inserted, then we insert now.
        if(this.namedContentChannel && !this.namedChannelInserted) {
          this.insertNamedContentChannel(contentChannels);
        }
        break;
      }

    }

    return {
      hasMoreChannels: hasMoreChannels,
      contentChannels: contentChannels
    }
  }

  render() {
    return (
      <div>
        <div style={{display: !this.state.loading ? "" : "none"}}>
          <div className="noContent" style={{display: this.props.channelNameOrCategory === "" ? '' : 'none' }}>
            No Content Channel has been chosen yet.
          </div>
          <div className="noContent" style={{display: this.state.listChannels.length === 0 && this.props.channelNameOrCategory !== "" ? '' : 'none' }}>
            No Content Channel has found.
          </div>
        </div>
        <div style={{display: this.state.listChannels.length > 0 && !this.state.newSearchFetching ? '' : 'none' }}>
          <div>
            {this.state.listChannels}
          </div>
          <div style={{display: this.state.hasMoreChannels && !this.state.loading ? '' : 'none'}}>
            <Button className="btn-block regularButton" onClick={(e) => this.showMoreChannelsInTopic()}>Show more Channels</Button>
          </div>
        </div>
        <Loading loading={this.state.loading} />
      </div>
    );
  }

}
