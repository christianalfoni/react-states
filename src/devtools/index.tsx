import * as React from 'react';
import { Resizer } from './Resizer';
import { DEBUG_TRANSITIONS, DEBUG_IS_EVENT_IGNORED, States } from '../';

import { Manager } from './Manager';
import { StatesItem } from './StatesItem';
import { colors } from './styles';

const DEBUG_TRIGGER_TRANSITIONS = Symbol('DEBUG_TRIGGER_TRANSITIONS');

const managerContext = React.createContext({} as Manager);

export const useDevtoolsManager = () => React.useContext(managerContext);

// We have to type as any as States<any, any> throws error not matching
// the explicit context
export const useDevtools = (id: string, reducer: States<any, any>) => {
  const manager = React.useContext(managerContext);
  const [context, dispatch] = reducer;

  React.useEffect(() => () => manager.dispose(id), [id, manager]);

  reducer[1] = (event: any) => {
    event[DEBUG_IS_EVENT_IGNORED] = false;

    dispatch(event);

    if (event.type === DEBUG_TRIGGER_TRANSITIONS) {
      manager.onMessage(id, {
        type: 'transitions',
        // @ts-ignore
        transitions: context[DEBUG_TRANSITIONS],
      });
      return;
    }

    manager.onMessage(id, {
      type: 'dispatch',
      event,
      ignored: event[DEBUG_IS_EVENT_IGNORED],
    });
  };

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      context,
      // @ts-ignore
      transitions: context[DEBUG_TRANSITIONS],
      triggerTransitions: () => {
        // We dispatch to ensure the transition is run
        reducer[1]({
          type: DEBUG_TRIGGER_TRANSITIONS,
        });
      },
    });
  }, [id, manager, context]);
};

export const DevtoolsProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <managerContext.Provider value={new Manager()}>
      <div suppressHydrationWarning>{typeof document === 'undefined' ? null : <DevtoolsManager />}</div>
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
