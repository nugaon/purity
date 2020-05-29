import React from 'react';
import TimeAgo from "react-timeago";
import { Card, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AiOutlineFileSearch } from "react-icons/ai";
import "./App.css";
import ContentChannel from "./contracts/ContentChannel";
import { StorageService } from "./services/StorageService";

interface Props {
  subscriptions: Array<ContentChannel>;
  onSearch: Function;
}

interface State {
  events: {
    contentUpload: any
  }
}

export class ListSubscriptions extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.closeSubscriptionEvent = this.closeSubscriptionEvent.bind(this);

    this.state = {
      events: StorageService.getMySubscriptionEvents()
    };
  }

  // at client address change
  public clientChange() {
    this.setState({
      events: StorageService.getMySubscriptionEvents(),
    });
  }

  closeSubscriptionEvent(eventType: string, channelName: string) {
    let events = this.state.events;
    delete events[eventType][channelName];
    this.setState({
      events: events
    })
    StorageService.saveMySubscriptionEvents(events);
  }

  onContentUploadHappened(channel: ContentChannel) {
    let events = this.state.events;
    let contentUploads = this.state.events.contentUpload;

    if(!contentUploads) {
      contentUploads = {
        [channel.channelName]: 1
      }
    } else if(channel.channelName in contentUploads) {
      //init sub count
      contentUploads[channel.channelName] += 1;
    } else {
      contentUploads[channel.channelName] = 1;
    }

    events.contentUpload = contentUploads;
    this.setState({
      events: events
    });
    StorageService.saveMySubscriptionEvents(events);
  }

  render() {
    const events: Array<React.ReactNode> = [];
    //subscription events
    if(this.state.events["contentUpload"]) {
      const channelNames: Array<string> = Object.keys(this.state.events.contentUpload);
      console.log("channelNames", channelNames);
      for(const channelName of channelNames) {
        const subCount = this.state.events.contentUpload[channelName];
        events.push(
          <div key={channelName + "-uploadEvent"} className="alert alert-dark alert-dismissable" role="alert">
            <a onClick={() => this.closeSubscriptionEvent("contentUpload", channelName)} className="close clickable" data-dismiss="alert" aria-label="close">&times;</a>
            Channel '{channelName}' has uploaded {subCount} new Content;
          </div>
        );
      }
    }

    const subscriptions = this.props.subscriptions.map((channel) => {
      const userSubTime = new Date(channel.getUserSubTime());
      const now = new Date();

      return (
        <Card className="marginBottom" bg="dark" text="white" key={channel.channelName}>
          <Card.Header className="channelName">
            {channel.channelName}
          </Card.Header>

          <Card.Body>
            { userSubTime > now ? 'Premium' : 'Basic'}<br />
            <TimeAgo className="timegago" date={userSubTime} />
            <span className="timegago" style={{display: userSubTime < now ? '' : 'none'}}>Don't have Premium Sub</span>

          </Card.Body>

          <Card.Footer>
            <Row>
              <Col>
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
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      );
    });

    return (
      <>
      <div className="noContent" style={{display: this.props.subscriptions.length === 0 ? '' : 'none' }}>
        To subscribe a channel, click on the <b>'Subscriptions'</b> text above.
      </div>
      <div className="events">
        {events}
      </div>
      <div className="listBox">
        {subscriptions}
      </div>
      </>
    );
  }
}
