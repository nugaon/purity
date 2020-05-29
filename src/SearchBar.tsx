import React from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { TiZoom } from "react-icons/ti";

interface Props {
  onSearch: Function;
}

interface State {

}

export class SearchBar extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.searchFor = this.searchFor.bind(this);
  }

  searchFor(e) {
    e.preventDefault();
    const searchForValue = e.target.elements.searchForValue.value;
    this.props.onSearch(searchForValue);
    e.target.reset();
  }

  render() {
    return (
      <Form onSubmit={ this.searchFor }>
        <InputGroup className="mb-3">
          <Form.Control
          placeholder="Channel name or category"
          aria-label="Channel name or category"
          aria-describedby="search-for-channel"
          name="searchForValue"
          />
          <InputGroup.Append>
          <Button type="submit" variant="outline-secondary"><TiZoom /></Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    );
  }

}
