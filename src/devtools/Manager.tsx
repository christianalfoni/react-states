import { TEvent, TContext, TTransitions, DEBUG_TRANSITIONS } from '../';

export type DevtoolMessage =
  | {
      type: 'dispatch';
      event: TEvent;
      ignored: boolean;
    }
  | {
      type: 'state';
      context: {
        state: string;
      };
      triggerTransitions: () => void;
    }
  | {
      type: 'transitions';
      transitions: TTransitions;
    };

export type HistoryItem =
  | {
      type: 'state';
      context: TContext;
    }
  | {
      type: 'event';
      event: TEvent;
      ignored: boolean;
    };

export type StatesData = {
  [id: string]: {
    isMounted: boolean;
    history: HistoryItem[];
    transitions: TTransitions;
    triggerTransitions: () => void;
  };
};

export type Subscription = (statesData: StatesData) => () => void;

export class Manager {
  private subscriptions: Function[] = [];
  states: StatesData = {};
  private notify() {
    this.subscriptions.forEach((cb) => cb(this.states));
  }
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
            history: isFirstState
              ? [
                  ...this.states[id].history,
                  {
                    type: 'state',
                    context: message.context,
                  },
                ]
              : [
                  {
                    type: 'state',
                    context: message.context,
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
                type: 'event',
                event: message.event,
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
