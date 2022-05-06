import { IAction, IState } from '../';

export type DevtoolMessage =
  | {
      type: 'dispatch';
      action: IAction;
      ignored: boolean;
    }
  | {
      type: 'state';
      state: {
        state: string;
      };
      triggerTransitions: () => void;
    }
  | {
      type: 'transitions';
      transitions: {
        [key: string]: {
          [key: string]: Function;
        };
      };
    }
  | {
      type: 'command';
      command: {
        cmd: string;
      };
    };

export type HistoryItem =
  | {
      type: 'state';
      state: IState;
    }
  | {
      type: 'action';
      action: IAction;
      ignored: boolean;
    };

export type StatesData = {
  [id: string]: {
    isMounted: boolean;
    history: HistoryItem[];
    transitions: {
      [key: string]: {
        [key: string]: Function;
      };
    };
    triggerTransitions: () => void;
  };
};

export type Subscription = (statesData: StatesData) => () => void;

function debounce(func: (...args: any[]) => void, timeout: number) {
  let timer: NodeJS.Timer;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

export class Manager {
  private subscriptions: Function[] = [];
  states: StatesData = {};
  private notify = debounce(() => {
    this.subscriptions.forEach((cb) => cb(this.states));
  }, 100);
  private ensureStates(id: string) {
    if (!this.states[id]) {
      this.states[id] = {
        isMounted: true,
        history: [],
        // @ts-ignore
        transitions: {},
        triggerTransitions: () => {},
      };
    }
  }
  onMessage(id: string, message: DevtoolMessage) {
    this.ensureStates(id);

    switch (message.type) {
      case 'state': {
        // You might trigger dispatches before the devtools has sent its initial state
        const isFirstState = this.states[id].history.filter((item) => item.type === 'state').length === 0;

        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            isMounted: true,
            history: isFirstState
              ? [
                  ...this.states[id].history,
                  {
                    type: 'state',
                    state: message.state,
                  },
                ]
              : [
                  {
                    type: 'state',
                    state: message.state,
                  },
                  ...this.states[id].history,
                ],
            triggerTransitions: message.triggerTransitions,
          },
        };
        break;
      }

      case 'transitions': {
        this.states = {
          ...this.states,
          [id]: {
            ...this.states[id],
            transitions: message.transitions,
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
    }
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
