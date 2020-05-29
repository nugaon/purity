import React from 'react';
import { Card, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap';
import { FileUploading } from "./modals/FileUploading";
import { ChannelSettings } from "./modals/ChannelSettings";
import { SendChannelCoins } from "./modals/SendChannelCoins";
import "./App.css";
import ContentChannel from "./contracts/ContentChannel";
import { ExtendedWeb3Client } from "./IApp";
import { AiOutlineFileSearch } from "react-icons/ai";
import { StorageService } from "./services/StorageService";
import AnimatedNumber from 'animated-number-react';

interface Props {
  ownedChannels: Array<ContentChannel>;
  web3: ExtendedWeb3Client;
  onSearch: Function;
  onChannelPriceChange: Function;
}

interface State {
  events: {
    newSubsriptions: any;
  };
}

export class ListOwnedChannels extends React.Component<Props, State> {

  constructor(props: Props){
    super(props);
    this.closeSubscriptionEvent = this.closeSubscriptionEvent.bind(this);

    this.state = {
      events: StorageService.getOwnedChannelEvents(),
    }
  }

  // at client address change
  public clientChange() {
    this.setState({
      events: StorageService.getOwnedChannelEvents(),
    });
  }

  /// Called from parent component
  public onSubscriptionHappened(channel: ContentChannel) {
    let events = this.state.events;
    let newSubsriptions = this.state.events.newSubsriptions;

    if(!newSubsriptions) {
        newSubsriptions = {
            [channel.channelName]: 1
        };
    } else if(channel.channelName in newSubsriptions) {
      //init sub count
      newSubsriptions[channel.channelName] += 1;
    } else {
      newSubsriptions[channel.channelName] = 1;
    }

    events.newSubsriptions = newSubsriptions;
    this.setState({
      events: events
    });
    StorageService.saveOwnedChannelsEvents(events);
  }

  closeSubscriptionEvent(eventType: string, channelName: string) {
    let events = this.state.events;
    delete events[eventType][channelName];
    this.setState({
      events: events
    });
    StorageService.saveOwnedChannelsEvents(events);
  }

  render() {
    const prettyNumber = function(number: string) {
      return parseFloat(number).toFixed(6);
    }

    const events: Array<React.ReactNode> = [];
    //subscription events
    if(this.state.events["newSubsriptions"]) {
      const channelNames: Array<string> = Object.keys(this.state.events.newSubsriptions);
      for(const channelName of channelNames) {
        const subCount = this.state.events.newSubsriptions[channelName];
        events.push(
          <div key={channelName + "-subscrptionEvent"} className="alert alert-dark alert-dismissable" role="alert">
          <a onClick={() => this.closeSubscriptionEvent("newSubsriptions", channelName)} className="close clickable" data-dismiss="alert" aria-label="close">&times;</a>
          Channel '{channelName}' has got {subCount} new Subscriptions;
          </div>
        );
      }
    }

    const channel = this.props.ownedChannels.map((channel) => {
      return (
          <Card className="marginBottom" bg="dark" text="white" key={channel.channelName}>
            <Card.Header className="channelName">
              {channel.channelName}
            </Card.Header>
            <Card.Body>
              Balance<br />
              <AnimatedNumber
                value={channel.balance}
                duration={800}
                formatValue={n => prettyNumber(n)}/>
              <span className="currency"> ETH</span>
            </Card.Body>
            <Card.Footer>
              <Row>
                <Col className="paddingBetween">
                  <FileUploading contentChannel={channel} web3={this.props.web3} />
                  <ChannelSettings contentChannel={channel} />
                  <OverlayTrigger
                    key="bottom"
                    placement="bottom"
                    overlay={
                      <Tooltip id="tooltip-search">
                        Get detailed data of the Channel
                      </Tooltip>
                    }
                  >
                    <span className="clickable dot" onClick={() => this.props.onSearch(channel.channelName)}><AiOutlineFileSearch /></span>
                  </OverlayTrigger>
                  <SendChannelCoins contentChannel={channel} web3={this.props.web3} onChannelPriceChange={this.props.onChannelPriceChange} />
                </Col>
              </Row>
            </Card.Footer>
          </Card>
      );
    });

    return (
      <>
      <div className="noContent" style={{display: this.props.ownedChannels.length === 0 ? '' : 'none' }}>
        To Create a channel, click on the <b>'Create Channel'</b> button above.
      </div>
      <div className="events">
        {events}
      </div>
      <div className="listBox">
        {channel}
      </div>
      </>
    );
  }
}
