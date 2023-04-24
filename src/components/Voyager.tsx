import './Voyager.css';
import './viewport.css';

import { ThemeProvider } from '@mui/material/styles';
import { getIntrospectionQuery } from 'graphql/utilities';
import {
  Children,
  Component,
  createRef,
  type ReactElement,
  type ReactNode,
} from 'react';

import { getTypeGraph, SVGRender } from '../graph/';
import { extractTypeId, getSchema } from '../introspection';
import DocExplorer from './doc-explorer/DocExplorer';
import GraphViewport from './GraphViewport';
import { theme } from './MUITheme';
import Settings from './settings/Settings';
import PoweredBy from './utils/PoweredBy';
import { VoyagerLogo } from './utils/VoyagerLogo';

type IntrospectionProvider = (query: string) => Promise<any>;

export interface VoyagerDisplayOptions {
  rootType?: string;
  skipRelay?: boolean;
  skipDeprecated?: boolean;
  showLeafFields?: boolean;
  sortByAlphabet?: boolean;
  hideRoot?: boolean;
}

const defaultDisplayOptions = {
  rootType: undefined,
  skipRelay: true,
  skipDeprecated: true,
  sortByAlphabet: false,
  showLeafFields: true,
  hideRoot: false,
};

function normalizeDisplayOptions(options) {
  return options != null
    ? { ...defaultDisplayOptions, ...options }
    : defaultDisplayOptions;
}

export interface VoyagerProps {
  introspection: IntrospectionProvider | unknown;
  displayOptions?: VoyagerDisplayOptions;
  hideDocs?: boolean;
  hideSettings?: boolean;
  hideVoyagerLogo?: boolean;

  children?: ReactNode;
}

export default class Voyager extends Component<VoyagerProps> {
  state = {
    introspectionData: null,
    schema: null,
    typeGraph: null,
    displayOptions: defaultDisplayOptions,
    selectedTypeID: null,
    selectedEdgeID: null,
  };

  svgRenderer: SVGRender;
  viewportRef = createRef<GraphViewport>();
  introspectionPromise = null;

  constructor(props) {
    super(props);
    this.svgRenderer = new SVGRender();
  }

  componentDidMount() {
    this.fetchIntrospection();
  }

  fetchIntrospection() {
    const displayOptions = normalizeDisplayOptions(this.props.displayOptions);

    if (typeof this.props.introspection !== 'function') {
      this.updateIntrospection(this.props.introspection, displayOptions);
      return;
    }

    console.warn(
      'GraphQLVoyager: Passing function as "introspection" is deprecated.' +
        'To access introspection query, please use "voyagerIntrospectionQuery".',
    );

    const promise = this.props.introspection(getIntrospectionQuery());
    this.setState({
      introspectionData: null,
      schema: null,
      typeGraph: null,
      displayOptions: null,
      selectedTypeID: null,
      selectedEdgeID: null,
    });

    this.introspectionPromise = promise;
    promise.then((introspectionData) => {
      if (promise === this.introspectionPromise) {
        this.introspectionPromise = null;
        this.updateIntrospection(introspectionData, displayOptions);
      }
    });
  }

  updateIntrospection(introspectionData, displayOptions) {
    const schema = getSchema(
      introspectionData,
      displayOptions.sortByAlphabet,
      displayOptions.skipRelay,
      displayOptions.skipDeprecated,
    );
    const typeGraph = getTypeGraph(
      schema,
      displayOptions.rootType,
      displayOptions.hideRoot,
    );

    this.setState({
      introspectionData,
      schema,
      typeGraph,
      displayOptions,
      selectedTypeID: null,
      selectedEdgeID: null,
    });
  }

  componentDidUpdate(prevProps: VoyagerProps) {
    if (this.props.introspection !== prevProps.introspection) {
      this.fetchIntrospection();
    } else if (this.props.displayOptions !== prevProps.displayOptions) {
      this.updateIntrospection(
        this.state.introspectionData,
        normalizeDisplayOptions(this.props.displayOptions),
      );
    }

    if (this.props.hideDocs !== prevProps.hideDocs) {
      this.viewportRef.current.resize();
    }
  }

  render() {
    const {
      hideDocs = false,
      hideSettings = false,
      // TODO: switch to false in the next major version
      hideVoyagerLogo = true,
    } = this.props;

    return (
      <ThemeProvider theme={theme}>
        <div className="graphql-voyager">
          {!hideDocs && this.renderPanel(hideVoyagerLogo)}
          {!hideSettings && this.renderSettings()}
          {this.renderGraphViewport()}
        </div>
      </ThemeProvider>
    );
  }

  renderPanel(hideVoyagerLogo: boolean) {
    const children = Children.toArray(this.props.children);
    const panelHeader = children.find(
      (child: ReactElement) => child.type === Voyager.PanelHeader,
    );

    const { typeGraph, selectedTypeID, selectedEdgeID } = this.state;
    const onFocusNode = (id) => this.viewportRef.current.focusNode(id);

    return (
      <div className="doc-panel">
        <div className="contents">
          {!hideVoyagerLogo && <VoyagerLogo />}
          {panelHeader}
          <DocExplorer
            typeGraph={typeGraph}
            selectedTypeID={selectedTypeID}
            selectedEdgeID={selectedEdgeID}
            onFocusNode={onFocusNode}
            onSelectNode={this.handleSelectNode}
            onSelectEdge={this.handleSelectEdge}
          />
          <PoweredBy />
        </div>
      </div>
    );
  }

  renderSettings() {
    const { schema, displayOptions } = this.state;

    if (schema == null) return null;

    return (
      <Settings
        schema={schema}
        options={displayOptions}
        onChange={this.handleDisplayOptionsChange}
      />
    );
  }

  renderGraphViewport() {
    const { displayOptions, typeGraph, selectedTypeID, selectedEdgeID } =
      this.state;

    return (
      <GraphViewport
        svgRenderer={this.svgRenderer}
        typeGraph={typeGraph}
        displayOptions={displayOptions}
        selectedTypeID={selectedTypeID}
        selectedEdgeID={selectedEdgeID}
        onSelectNode={this.handleSelectNode}
        onSelectEdge={this.handleSelectEdge}
        ref={this.viewportRef}
      />
    );
  }

  handleDisplayOptionsChange = (delta) => {
    const displayOptions = { ...this.state.displayOptions, ...delta };
    this.updateIntrospection(this.state.introspectionData, displayOptions);
  };

  handleSelectNode = (selectedTypeID) => {
    if (selectedTypeID !== this.state.selectedTypeID) {
      this.setState({ selectedTypeID, selectedEdgeID: null });
    }
  };

  handleSelectEdge = (selectedEdgeID) => {
    if (selectedEdgeID === this.state.selectedEdgeID) {
      // deselect if click again
      this.setState({ selectedEdgeID: null });
    } else {
      const selectedTypeID = extractTypeId(selectedEdgeID);
      this.setState({ selectedTypeID, selectedEdgeID });
    }
  };

  static PanelHeader = (props) => {
    return props.children || null;
  };
}
