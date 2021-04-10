import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  TAction,
  TContext,
  TEffect,
  DEBUG_TRANSITIONS,
  DEBUG_EXEC,
  RESOLVER_PROMISE,
  DEBUG_IS_ACTION_IGNORED,
  StatesReducer,
} from '../';

import { Manager } from './Manager';
import { StatesItem } from './StatesItem';
import { colors } from './styles';

const DEBUG_TRIGGER_TRANSITIONS = Symbol('DEBUG_TRIGGER_TRANSITIONS');

const managerContext = React.createContext({} as Manager);

export const useDevtoolsManager = () => React.useContext(managerContext);

function applyExecDebugToContext(
  context: TContext,
  cb: (effect: TEffect<any>, context: TContext, path: string[]) => void,
  path: string[] = [],
) {
  // @ts-ignore
  context[DEBUG_EXEC] = (effect: TEffect<any>) => {
    return cb(effect, context, path);
  };

  Object.keys(context).forEach((key) => {
    const value = (context as any)[key];
    if (!Array.isArray(value) && typeof value === 'object' && value !== null && typeof value.state === 'string') {
      applyExecDebugToContext(value, cb, path.concat(key));
    }
  });
}

// We have to type as any as States<any, any> throws error not matching
// the explicit context
export const useDevtools = (id: string, reducer: StatesReducer<any, any>) => {
  const manager = React.useContext(managerContext);
  const [context, dispatch] = reducer;

  React.useEffect(() => {
    // @ts-ignore
    manager.mount(id, () => {
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

    return () => {
      manager.dispose(id);
    };
  }, [id, manager]);

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      context,
      // @ts-ignore
      transitions: context[DEBUG_TRANSITIONS],
    });
  }, [id, manager, context]);

  applyExecDebugToContext(context, (effect, contextLevel, path) => {
    const returnedValue = effect(contextLevel);
    const name = path.concat(effect.name).join('.');
    // @ts-ignore
    if (returnedValue && returnedValue[RESOLVER_PROMISE]) {
      // @ts-ignore
      returnedValue[RESOLVER_PROMISE].then((result: any) => {
        manager.onMessage(id, {
          type: 'exec-resolved',
          context,
          name,
          result,
        });
      }).catch(() => {
        // Something really bad happened, ignore it
      });
    }

    manager.onMessage(id, {
      type: 'exec',
      context,
      name,
    });

    return returnedValue;
  });

  reducer[1] = (action: any) => {
    action[DEBUG_IS_ACTION_IGNORED] = false;
    dispatch(action);

    if (action.type === DEBUG_TRIGGER_TRANSITIONS) {
      return;
    }

    manager.onMessage(id, {
      type: 'dispatch',
      action,
      ignored: action[DEBUG_IS_ACTION_IGNORED],
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
