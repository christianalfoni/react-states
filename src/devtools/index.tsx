import * as React from 'react';
import { createPortal } from 'react-dom';
import { TRANSITIONS, States, TAction, TContext, TTransitions, TEffects } from '../';
import { StatesItem } from './StatesItem';
import { colors } from './styles';

export type DevtoolMessage =
  | {
      type: 'dispatch';
      action: TAction;
    }
  | {
      type: 'state';
      context: {
        state: string;
      };
    }
  | {
      type: 'exec';
      context: {
        state: string;
      };
      name: string;
    };

export type HistoryItem =
  | {
      type: 'state';
      context: TContext;
      execs: string[];
      transitions: {
        [state: string]: string[];
      };
    }
  | {
      type: 'action';
      action: TAction;
    };

export type StatesData = {
  [id: string]: {
    isMounted: boolean;
    history: HistoryItem[];
    transitions: TTransitions<any, any, any>;
  };
};

export type Subscription = (statesData: StatesData) => () => void;

class Manager {
  private subscriptions: Function[] = [];
  states: StatesData = {};
  private notify() {
    this.subscriptions.forEach(cb => cb(this.states));
  }
  onMessage(id: string, message: DevtoolMessage) {
    switch (message.type) {
      case 'state':
        // No idea what TypeScript complains here, but not below
        // @ts-ignore
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            history: [
              {
                type: 'state',
                context: message.context,
                execs: [],
              },
              ...this.states[id].history,
            ],
          },
        };
        break;
      case 'dispatch':
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            history: [
              {
                type: 'action',
                action: message.action,
              },
              ...this.states[id].history,
            ],
          },
        };
        break;
      case 'exec':
        const lastStateEntryIndex = this.states[id].history.findIndex(item => item.type === 'state')!;
        const lastStateEntry = this.states[id].history[lastStateEntryIndex] as HistoryItem & { type: 'state' };
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            history: [
              ...this.states[id].history.slice(0, lastStateEntryIndex),
              {
                ...lastStateEntry,
                execs: [...lastStateEntry.execs, message.name],
              },
              ...this.states[id].history.slice(lastStateEntryIndex + 1),
            ],
          },
        };
        break;
    }
    this.notify();
  }
  mount(id: string, transitions: TTransitions<any, any, any>) {
    this.states = {
      ...this.states,
      [id]: {
        isMounted: true,
        history: [],
        transitions,
      },
    };
    this.notify();
  }
  dispose(id: string) {
    this.states = {
      ...this.states,
      [id]: {
        ...this.states[id],
        isMounted: false,
      },
    };
    this.notify();
  }
  subscribe(cb: Function) {
    this.subscriptions.push(cb);
    return () => {
      this.subscriptions.splice(this.subscriptions.indexOf(cb), 1);
    };
  }
}

const managerContext = React.createContext({} as Manager);

export const useDevtoolsManager = () => React.useContext(managerContext);

export const useDevtools = (id: string, states: States<any, any>) => {
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
  states.exec = effects =>
    originalExec(
      Object.keys(effects).reduce((aggr, key) => {
        const originalEffect = effects[key]!;
        aggr[key] = context => {
          manager.onMessage(id, {
            type: 'exec',
            context,
            name: originalEffect.name,
          });
          return originalEffect(context);
        };

        return aggr;
      }, {} as TEffects<any>) as any,
    );

  const originalDispatch = states.dispatch;
  states.dispatch = action => {
    manager.onMessage(id, {
      type: 'dispatch',
      action,
    });
    originalDispatch(action);
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
  const [isOpen, toggleOpen] = React.useState(JSON.parse(localStorage.getItem(IS_OPEN_STORAGE_KEY) || 'false'));

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
