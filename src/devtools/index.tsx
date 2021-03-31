import * as React from 'react';
import { createPortal } from 'react-dom';
import { TRANSITIONS, TAction, TEffects, RESOLVER_PROMISE } from '../';
import { Manager } from './Manager';
import { StatesItem } from './StatesItem';
import { colors } from './styles';

const managerContext = React.createContext({} as Manager);

export const useDevtoolsManager = () => React.useContext(managerContext);

export const IS_ACTION_IGNORED = Symbol('IS_ACTION_IGNORED');

// We have to type as any as States<any, any> throws error not matching
// the explicit context
export const useDevtools = (id: string, states: { context: any; exec: any; map: any; dispatch: any }) => {
  const manager = React.useContext(managerContext);

  React.useEffect(() => {
    // @ts-ignore
    manager.mount(id, states[TRANSITIONS]);

    return () => {
      manager.dispose(id);
    };
  }, [id, manager]);

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      context: states.context,
    });
  }, [id, manager, states]);

  const originalExec = states.exec;
  states.exec = (effects: any) =>
    originalExec(
      Object.keys(effects).reduce((aggr, key) => {
        const originalEffect = effects[key]!;

        aggr[key] = context => {
          const returnedValue = originalEffect(context);

          if (returnedValue && returnedValue[RESOLVER_PROMISE]) {
            returnedValue[RESOLVER_PROMISE].then((result: any) => {
              manager.onMessage(id, {
                type: 'exec-resolved',
                context,
                name: originalEffect.name,
                result,
              });
            }).catch(() => {
              // Something really bad happened, ignore it
            });
          }

          manager.onMessage(id, {
            type: 'exec',
            context,
            name: originalEffect.name,
          });

          return returnedValue;
        };

        return aggr;
      }, {} as TEffects<any>) as any,
    );

  const originalDispatch = states.dispatch;
  states.dispatch = (action: any) => {
    action[IS_ACTION_IGNORED] = false;

    originalDispatch(action);
    manager.onMessage(id, {
      type: 'dispatch',
      action,
      ignored: action[IS_ACTION_IGNORED],
    });
  };
};

export const DevtoolsProvider = ({ children }: { children: React.ReactNode }) => {
  return <managerContext.Provider value={new Manager()}>{children}</managerContext.Provider>;
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
    id => {
      setExpandedStates(current =>
        current.includes(id) ? current.filter(existingId => existingId !== id) : current.concat(id),
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
        onClick={() => toggleOpen(current => !current)}
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
          {Object.keys(statesData).map(id => {
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
              />
            );
          })}
        </ul>
      ) : null}
    </div>,
    targetEl,
  );
};
