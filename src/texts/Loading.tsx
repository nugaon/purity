import React from "react";
import "../App.css";

interface Props {
  loading: boolean;
}

const Loading: React.SFC<Props> = (props: Props) => {
    return (
        <div className="text-center marginTop loading align-middle" style={{display: props.loading ? "" : "none"}}>
          <div>
            Loading...
          </div>
          <div className="marginTop spinner-border text-info" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
    )
}

export default Loading;
