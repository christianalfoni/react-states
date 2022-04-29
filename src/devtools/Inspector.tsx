import * as React from 'react';

import * as styles from './styles';
import { isArray, isObject } from './utils';

function renderValue({
  path,
  value,
  delimiter,
  renderPaths,
  expandedPaths,
  onClickPath,
  onToggleExpand,
  selectedStatePath,
  onSubmitState,
}: {
  onSubmitState?: (newState: string) => void;
  selectedStatePath?: string;
  onToggleExpand: (path: string[]) => void;
  path: string;
  delimiter: string;
  value: any;
  renderPaths?: RenderPaths;
  expandedPaths: string[];
  onClickPath?: (path: string[]) => void;
}) {
  const wrapper = renderPaths && renderPaths[path];
  let node;

  if (isObject(value)) {
    node = (
      <Nested
        key={path}
        startBracket="{"
        endBracket="}"
        path={path}
        delimiter={delimiter}
        expandedPaths={expandedPaths}
        hasWrapper={Boolean(wrapper)}
        onClickPath={onClickPath}
        renderPaths={renderPaths}
        onToggleExpand={onToggleExpand}
        isArray={false}
        value={value}
        selectedStatePath={selectedStatePath}
        onSubmitState={onSubmitState}
      />
    );
  } else if (isArray(value)) {
    node = (
      <Nested
        key={path}
        startBracket="["
        endBracket="]"
        delimiter={delimiter}
        renderPaths={renderPaths}
        path={path}
        expandedPaths={expandedPaths}
        hasWrapper={Boolean(wrapper)}
        onClickPath={onClickPath}
        onToggleExpand={onToggleExpand}
        isArray
        value={value}
        selectedStatePath={selectedStatePath}
        onSubmitState={onSubmitState}
      />
    );
  } else {
    node = (
      <ValueComponent
        key={path}
        path={path}
        delimiter={delimiter}
        value={value}
        onClickPath={onClickPath}
        selectedStatePath={selectedStatePath}
        hasWrapper={Boolean(wrapper)}
        onSubmitState={onSubmitState}
      />
    );
  }

  return wrapper ? wrapper(node) : node;
}

type PathKeyProps = {
  path: string;
  onClickPath?: (path: string[]) => void;
  onToggleExpand?: (path: string[]) => void;
  disabled: boolean;
  delimiter: string;
};

const PathKey = ({ path, onClickPath, onToggleExpand, disabled, delimiter }: PathKeyProps) => {
  return path.length ? (
    <span
      style={styles.key}
      onClick={
        disabled
          ? undefined
          : (event) => {
              event.stopPropagation();
              if (onClickPath && (event.metaKey || event.ctrlKey)) {
                onClickPath(path.split(delimiter));
              } else if (onToggleExpand) {
                onToggleExpand(path.split(delimiter));
              }
            }
      }
    >
      {path.split(delimiter).pop()}:
    </span>
  ) : null;
};

type NestedProps = {
  startBracket: string;
  endBracket: string;
  expandedPaths: string[];
  renderPaths?: RenderPaths;
  delimiter: string;
  path: string;
  hasWrapper: boolean;
  isArray: boolean;
  value: any;
  onToggleExpand: (path: string[]) => void;
  onClickPath?: (path: string[]) => void;
  selectedStatePath?: string;
  onSubmitState?: (newState: string) => void;
};

const Nested = React.memo(
  ({
    expandedPaths,
    path,
    onToggleExpand,
    onClickPath,
    startBracket,
    renderPaths,
    hasWrapper,
    endBracket,
    isArray,
    selectedStatePath,
    value,
    delimiter,
    onSubmitState,
  }: NestedProps) => {
    const shouldCollapse = !expandedPaths.includes(path);

    if (selectedStatePath && path === selectedStatePath) {
      return (
        <div
          style={styles.inlineNested}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(path.split(delimiter));
          }}
        >
          {path.length ? <span style={styles.key}>{path.split(delimiter).pop()}:</span> : null}
        </div>
      );
    }

    if (shouldCollapse) {
      const keys = Object.keys(value);

      return (
        <div
          style={styles.inlineNested}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(path.split(delimiter));
          }}
        >
          <PathKey
            path={path}
            delimiter={delimiter}
            onClickPath={onClickPath}
            onToggleExpand={onToggleExpand}
            disabled={!onSubmitState || hasWrapper}
          />
          {startBracket}
          <span style={styles.keyCount}>
            {isArray ? (
              keys.length + ' items'
            ) : (
              <span style={styles.inlineNested}>{keys.sort().slice(0, 3).join(', ') + '...'}</span>
            )}
          </span>
          {endBracket}
        </div>
      );
    }

    return (
      <div>
        <div
          style={styles.bracket(true)}
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(path.split(delimiter));
          }}
        >
          <PathKey
            path={path}
            delimiter={delimiter}
            onClickPath={onClickPath}
            onToggleExpand={onToggleExpand}
            disabled={!onSubmitState || hasWrapper}
          />
          {startBracket}
        </div>
        <div style={styles.nestedChildren}>
          {Array.isArray(value)
            ? value.map((_, index) =>
                renderValue({
                  path: path.concat((path ? delimiter : '') + String(index)),
                  delimiter,
                  value: value[index],
                  renderPaths,
                  expandedPaths,
                  onClickPath,
                  onSubmitState,
                  onToggleExpand,
                  selectedStatePath,
                }),
              )
            : Object.keys(value)
                .sort()
                .map((key) => {
                  return renderValue({
                    path: path.concat((path ? delimiter : '') + key),
                    value: value[key],
                    delimiter,
                    renderPaths,
                    expandedPaths,
                    onClickPath,
                    onSubmitState,
                    onToggleExpand,
                    selectedStatePath,
                  });
                })}
        </div>
        <div style={styles.bracket(false)}>{endBracket}</div>
      </div>
    );
  },
);

type ValueComponentProps = {
  value: string | number | boolean;
  path: string;
  hasWrapper: boolean;
  onClickPath?: (path: string[]) => void;
  delimiter: string;
  selectedStatePath?: string;
  onSubmitState?: (newState: string) => void;
};

const ValueComponent = React.memo(
  ({ value, path, onClickPath, selectedStatePath, onSubmitState, hasWrapper, delimiter }: ValueComponentProps) => {
    const [isHoveringString, setHoveringString] = React.useState(false);

    if (selectedStatePath && path === selectedStatePath) {
      return (
        <div style={styles.genericValue}>
          {path.length ? <span style={styles.key}>{path.split(delimiter).pop()}:</span> : null}
        </div>
      );
    }

    if (typeof value === 'string' && value[0] === '[' && value[value.length - 1] === ']') {
      return (
        <div style={styles.otherValue}>
          <PathKey
            path={path}
            delimiter={delimiter}
            onClickPath={onClickPath}
            disabled={!onSubmitState || hasWrapper}
          />
          {value.substr(1, value.length - 2)}
        </div>
      );
    }

    if (typeof value === 'string') {
      return (
        <div style={styles.stringValue}>
          <PathKey
            path={path}
            delimiter={delimiter}
            onClickPath={onClickPath}
            disabled={!onSubmitState || hasWrapper}
          />
          <div onMouseOver={() => setHoveringString(true)} onMouseOut={() => setHoveringString(false)}>
            "{value.length > 50 && !isHoveringString ? value.substr(0, 50) + '...' : value}"
          </div>
        </div>
      );
    }

    if (typeof value === 'function') {
      return (
        <div style={styles.otherValue}>
          <PathKey
            path={path}
            delimiter={delimiter}
            onClickPath={onClickPath}
            disabled={!onSubmitState || hasWrapper}
          />
          <div>action</div>
        </div>
      );
    }

    return (
      <div style={styles.genericValue}>
        <PathKey path={path} delimiter={delimiter} onClickPath={onClickPath} disabled={!onSubmitState || hasWrapper} />
        {String(value)}
      </div>
    );
  },
);

export type RenderPaths = {
  [path: string]: (children: React.ReactNode) => React.ReactNode;
};

type InspectorProps = {
  value: object;
  expandedPaths: string[];
  delimiter: string;
  small?: boolean;
  onToggleExpand: (path: string[]) => void;
  onClickPath?: (path: string[]) => void;
  renderPaths?: RenderPaths;
  selectedStatePath?: string;
  onSubmitState?: (newState: string) => void;
};

const Inspector = ({
  value,
  expandedPaths,
  small,
  onToggleExpand,
  delimiter,
  onClickPath = () => {},
  renderPaths,
  selectedStatePath = '',
  onSubmitState,
}: InspectorProps) => {
  return (
    <div style={small ? styles.smallWrapper : styles.wrapper}>
      {renderValue({
        path: '',
        delimiter,
        value,
        renderPaths,
        expandedPaths,
        onClickPath,
        onToggleExpand,
        selectedStatePath,
        onSubmitState,
      })}
    </div>
  );
};

export default Inspector;
