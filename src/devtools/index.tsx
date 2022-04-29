import * as React from 'react';
import { Resizer } from './Resizer';
import { managerContext } from '../';

import { Manager } from './Manager';
import { StatesItem } from './StatesItem';
import { colors } from './styles';

export const useDevtoolsManager = () => React.useContext(managerContext);

export const DevtoolsProvider = ({ children, show = true }: { children: React.ReactNode; show?: boolean }) => {
  return (
    <managerContext.Provider value={new Manager()}>
      <div suppressHydrationWarning>{typeof document === 'undefined' || !show ? null : <DevtoolsManager />}</div>
      {children}
    </managerContext.Provider>
  );
};

const IS_OPEN_STORAGE_KEY = 'react_states_isOpen';
const WIDTH_STORAGE_KEY = 'react_states_width';

export const DevtoolsManager = () => {
  const manager = React.useContext(managerContext);
  const [statesData, setStatesData] = React.useState(manager.states);
  const [expandedStates, setExpandedStates] = React.useState([] as string[]);
  const [isOpen, toggleOpen] = React.useState<boolean>(
    JSON.parse(localStorage.getItem(IS_OPEN_STORAGE_KEY) || 'false'),
  );
  const [width, setWidth] = React.useState(() => JSON.parse(localStorage.getItem(WIDTH_STORAGE_KEY) || '"400px"'));

  React.useEffect(() => manager.subscribe(setStatesData), [manager]);

  const toggleExpanded = React.useCallback(
    (id) => {
      setExpandedStates((current) =>
        current.includes(id) ? current.filter((existingId) => existingId !== id) : current.concat(id),
      );
    },
    [setExpandedStates],
  );

  React.useEffect(() => {
    localStorage.setItem(IS_OPEN_STORAGE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  return (
    <div
      suppressHydrationWarning
      style={{
        position: 'fixed',
        right: 0,
        fontFamily: 'monospace',
        top: 0,
        height: '100vh',
        width: isOpen ? width : '10px',
        backgroundColor: colors.background,
        zIndex: 9999999999999,
      }}
    >
      <Resizer
        onResize={(width) => {
          setWidth(width);
          localStorage.setItem(WIDTH_STORAGE_KEY, JSON.stringify(`${width}px`));
        }}
        onClick={() => toggleOpen((current) => !current)}
        isOpen={isOpen}
      />

      {isOpen ? (
        <ul
          style={{
            listStyleType: 'none',
            padding: 0,
            overflowY: 'scroll',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {Object.keys(statesData).map((id) => {
            const data = statesData[id];

            return (
              <StatesItem
                key={id}
                id={id}
                transitions={data.transitions}
                history={data.history}
                isMounted={data.isMounted}
                isExpanded={expandedStates.includes(id)}
                toggleExpanded={toggleExpanded}
                triggerTransitions={data.triggerTransitions}
              />
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
