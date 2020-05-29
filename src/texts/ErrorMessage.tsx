import React from "react";
import "../App.css";

interface Props {
  message: string;
  show: boolean;
}

const ErrorMessage: React.SFC<Props> = (props: Props) => {
    return (
        <div style={{display: props.show ? '' : 'none'}} className="errorMessage">
          {props.message}
        </div>
    )
}

export default ErrorMessage;
