import * as React from 'react';
import { HistoryItem } from './Manager';
import { TTransitions } from '..';
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
    transitions: TTransitions;
    currentState: string;
    history: HistoryItem[];
    triggerTransitions: () => void;
  }) => {
    const [currentTab, setCurrentTab] = React.useState<'history' | 'transitions'>('history');
    return (
      <div>
        <div style={{ display: 'flex' }}>
          <button
            style={{
              backgroundColor: 'transparent',
              border: 0,
              color: colors.text,
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer',
              textDecoration: currentTab === 'history' ? 'underline' : 'none',
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
              color: colors.text,
              fontWeight: 'bold',
              outline: 'none',
              cursor: 'pointer',
              textDecoration: currentTab === 'transitions' ? 'underline' : 'none',
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
