import * as React from 'react';
import { HistoryItem } from './Manager';
import { Transitions } from './Transitions';
import { History } from './History';
import { colors } from './styles';

export const ExpandedStates = React.memo(
  ({
    transitions,
    currentState,
    history,
    triggerTransitions,
  }: {
    transitions: {
      [key: string]: {
        [key: string]: Function;
      };
    };
    currentState: string | symbol;
    history: HistoryItem[];
    triggerTransitions: () => void;
  }) => {
    const [currentTab, setCurrentTab] = React.useState<'history' | 'transitions'>('history');
    return (
      <div>
        <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
          <button
            style={{
              backgroundColor: 'transparent',
              border: 0,
              padding: 0,
              fontFamily: 'inherit',
              color: currentTab === 'history' ? colors.blue : colors.text,
              outline: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '0.5rem',
            }}
            onClick={(event) => {
              event.stopPropagation();
              setCurrentTab('history');
            }}
          >
            history
          </button>
          <button
            style={{
              backgroundColor: 'transparent',
              border: 0,
              padding: 0,
              color: currentTab === 'transitions' ? colors.blue : colors.text,
              outline: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onClick={(event) => {
              event.stopPropagation();
              triggerTransitions();
              setCurrentTab('transitions');
            }}
          >
            transitions
          </button>
        </div>
        {currentTab === 'transitions' ? <Transitions transitions={transitions} currentState={currentState} /> : null}
        {currentTab === 'history' ? <History history={history} /> : null}
      </div>
    );
  },
);
