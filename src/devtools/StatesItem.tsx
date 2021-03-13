import * as React from 'react';
import { HistoryItem } from '.';
import { TTransitions } from '..';
import { ExpandedStates } from './ExpandedStates';
import { colors } from './styles';

export const StatesItem = React.memo(
  ({
    id,
    history,
    transitions,
    toggleExpanded,
    isMounted,
    isExpanded,
  }: {
    id: string;
    toggleExpanded: (id: string) => void;
    history: HistoryItem[];
    transitions: TTransitions<any, any, any>;
    isMounted: boolean;
    isExpanded: boolean;
  }) => {
    const currentState = history.find(item => item.type === 'state')! as HistoryItem & { type: 'state' };

    return (
      <li
        style={{
          padding: '1rem',
        }}
      >
        <div
          style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
          onClick={() => {
            toggleExpanded(id);
          }}
        >
          <span style={{ color: colors.text, marginRight: '0.25rem' }}>{isExpanded ? '▼' : '▶'}</span>
          <span style={{ color: colors.highlight, fontWeight: 'bold' }}>{id}</span>{' '}
          <span style={{ color: colors.yellow }}>{currentState.context.state}</span>
        </div>
        {isExpanded ? (
          <ExpandedStates history={history} transitions={transitions} currentState={currentState.context.state} />
        ) : null}
      </li>
    );
  },
);
