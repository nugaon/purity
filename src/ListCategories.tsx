import React from 'react';
import { default as PurityWeb } from "./contracts/PurityWeb";
import { Button, Card, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap';
import { AiOutlineFileSearch } from "react-icons/ai";
import { Category } from "./IApp";
import Loading from "./texts/Loading";
import "./ListContentChannels.css";
import "./App.css";

interface Props {
  purityWeb: PurityWeb;
  onSearch: Function;
  refreshCount: number;
}

interface State {
  listCategories: Array<React.ReactNode>;
  hasMoreCategory: boolean;
  loading: boolean;
}

export class ListCategories extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.showMoreCategories = this.showMoreCategories.bind(this);

    this.state = {
      listCategories: [],
      hasMoreCategory: false,
      loading: false,
    };
  }

  async fetchCategories() {
    this.setState({
      loading: true,
    })
    await this.props.purityWeb.fetchCategories();
    console.log("categoryy", this.props.purityWeb.categories);
    this.setState({
      listCategories: this.listCategoriesDom(this.props.purityWeb.categories),
      hasMoreCategory: this.props.purityWeb.hasCategoriesFetchMore,
      loading: false,
    });
  }

  componentDidUpdate(prevProps: Props) {
    if(this.props.refreshCount > prevProps.refreshCount) {
      this.props.purityWeb.resetCategories();
      this.fetchCategories();
    }
  }

  async showMoreCategories() {
    this.setState({
      loading: true,
    });
    this.props.purityWeb.needMoreCategories();
    await this.props.purityWeb.fetchCategories();
    const newCategoriesDom: Array<React.ReactNode> = [];
    for(let i = this.state.listCategories.length; i < this.props.purityWeb.categories.length; i++) {
      newCategoriesDom.push(
        this.listCategoryDom(this.props.purityWeb.categories[i])
      );
    }
    this.setState({
      listCategories: this.state.listCategories.concat(newCategoriesDom),
      hasMoreCategory: this.props.purityWeb.hasCategoriesFetchMore,
      loading: false
    });
  }

  listCategoriesDom(categories: Array<Category>): Array<React.ReactNode> {
     const domArray: Array<React.ReactNode> = [];
     for (const [i, category] of categories.entries()) {
       domArray.push(
         this.listCategoryDom(category)
       );
     }
     return domArray;
  }

  listCategoryDom(category: Category): React.ReactNode {
    return (
      <Card className="channelBody" bg="dark" text="white" key={category.id}>
        <Card.Header className="channelName">
          {category.name}
        </Card.Header>
        <Card.Body>
        <span className="biggerText">{category.channelCount}</span><br />
        <span>Channel Created</span>
        </Card.Body>
        <Card.Footer>
          <Row>
            <Col className="paddingBetween">
              <OverlayTrigger
                key="bottom"
                placement="bottom"
                overlay={
                  <Tooltip id="tooltip-search">
                    Get detailed data of the Category
                  </Tooltip>
                }
              >
                <span className="clickable dot" onClick={() => this.props.onSearch(category.name)}><AiOutlineFileSearch /></span>
              </OverlayTrigger>
            </Col>
          </Row>
        </Card.Footer>
      </Card>
    );
  }

  render() {
    return(
      <>
        <div className="categories">
          {this.state.listCategories}
        </div>
        <div style={{display: !this.state.loading  ? '' : 'none'}}>
          <div className="noContent" style={{display: this.state.listCategories.length === 0 ? '' : 'none' }}>
            There is no created categories on the PurityWeb yet. :c
          </div>
          <div>
            <div style={{display: this.props.purityWeb.hasCategoriesFetchMore  ? '' : 'none'}}>
              <Button className="btn-block regularButton" onClick={() => this.showMoreCategories()}>Show more Categories</Button>
            </div>
          </div>
        </div>
        <Loading loading={this.state.loading} />
      </>
    );
  }
}
