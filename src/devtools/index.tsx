import * as React from 'react';
import { createPortal } from 'react-dom';
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

  React.useMemo(() => {
    // @ts-ignore
    manager.mount(id, context, () => {
      // We dispatch to ensure the transition is run
      dispatch({
        type: DEBUG_TRIGGER_TRANSITIONS,
      });

      // No change to context, but at least we have the transitions there now
      manager.onMessage(id, {
        type: 'transitions',
        // @ts-ignore
        transitions: context[DEBUG_TRANSITIONS],
      });
    });
  }, []);

  React.useEffect(() => () => manager.dispose(id), [id, manager]);

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      context,
      // @ts-ignore
      transitions: context[DEBUG_TRANSITIONS],
    });
  }, [id, manager, context]);

  reducer[1] = (event: any) => {
    event[DEBUG_IS_EVENT_IGNORED] = false;
    dispatch(event);

    if (event.type === DEBUG_TRIGGER_TRANSITIONS) {
      return;
    }

    manager.onMessage(id, {
      type: 'dispatch',
      event,
      ignored: event[DEBUG_IS_EVENT_IGNORED],
    });
  };
};

export const DevtoolsProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <managerContext.Provider value={new Manager()}>
      <DevtoolsManager />
      {children}
    </managerContext.Provider>
  );
};

const IS_OPEN_STORAGE_KEY = 'react_states_isOpen';

export const DevtoolsManager = () => {
  const targetEl = React.useMemo(() => document.createElement('div'), []);
  const manager = React.useContext(managerContext);
  const [statesData, setStatesData] = React.useState(manager.states);
  const [expandedStates, setExpandedStates] = React.useState([] as string[]);
  const [isOpen, toggleOpen] = React.useState<boolean>(
    JSON.parse(localStorage.getItem(IS_OPEN_STORAGE_KEY) || 'false'),
  );

  React.useEffect(() => manager.subscribe(setStatesData), [manager]);

  React.useEffect(() => {
    document.body.appendChild(targetEl);
  }, [targetEl]);

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

  return createPortal(
    <div
      style={{
        position: 'fixed',
        right: 0,
        fontFamily: 'monospace',
        top: 0,
        height: '100vh',
        width: isOpen ? '400px' : '3rem',
        backgroundColor: '#333',
        zIndex: 9999999999999,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '1rem',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: colors.text,
        }}
        onClick={() => toggleOpen((current) => !current)}
      >
        {isOpen ? '⇨' : '⇦'}
      </div>
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
    </div>,
    targetEl,
  );
};
