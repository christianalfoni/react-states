import { TAction, TContext, TTransitions, Err, Ok } from '../';

export type DevtoolMessage =
  | {
      type: 'dispatch';
      action: TAction;
      ignored: boolean;
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
    }
  | {
      type: 'exec-resolved';
      context: {
        state: string;
      };
      name: string;
      result: Ok<any> | Err<any>;
    };

export type HistoryItem =
  | {
      type: 'state';
      context: TContext;
      exec:
        | {
            state: 'IDLE';
          }
        | {
            state: 'PENDING';
            name: string;
          }
        | {
            state: 'RESOLVED';
            result: any;
            name: string;
          }
        | {
            state: 'CANCELLED';
            name: string;
          };
      transitions: {
        [state: string]: string[];
      };
    }
  | {
      type: 'action';
      action: TAction;
      ignored: boolean;
    };

export type StatesData = {
  [id: string]: {
    isMounted: boolean;
    history: HistoryItem[];
    transitions: TTransitions<any, any, any>;
  };
};

export type Subscription = (statesData: StatesData) => () => void;

export class Manager {
  private subscriptions: Function[] = [];
  states: StatesData = {};
  private notify() {
    this.subscriptions.forEach(cb => cb(this.states));
  }
  onMessage(id: string, message: DevtoolMessage) {
    switch (message.type) {
      case 'state': {
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
                exec: {
                  state: 'IDLE',
                },
              },
              ...this.states[id].history,
            ],
          },
        };
        break;
      }
      case 'dispatch': {
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            history: [
              {
                type: 'action',
                action: message.action,
                ignored: message.ignored,
              },
              ...this.states[id].history,
            ],
          },
        };
        break;
      }
      case 'exec': {
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
                exec: {
                  state: 'PENDING',
                  name: message.name,
                },
              },
              ...this.states[id].history.slice(lastStateEntryIndex + 1),
            ],
          },
        };
        break;
      }
      case 'exec-resolved': {
        const lastStateEntryIndex = this.states[id].history.findIndex(
          item => item.type === 'state' && item.context.state === message.context.state,
        )!;
        const lastStateEntry = this.states[id].history[lastStateEntryIndex] as HistoryItem & { type: 'state' };
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            history: [
              ...this.states[id].history.slice(0, lastStateEntryIndex),
              {
                ...lastStateEntry,
                exec:
                  !message.result.ok && message.result.error.type === 'CANCELLED'
                    ? {
                        state: 'CANCELLED',
                        name: message.name,
                      }
                    : {
                        state: 'RESOLVED',
                        name: message.name,
                        result: message.result,
                      },
              },
              ...this.states[id].history.slice(lastStateEntryIndex + 1),
            ],
          },
        };
        break;
      }
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
