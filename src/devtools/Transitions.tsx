import * as React from 'react';
import { TTransitions } from '..';
import { colors } from './styles';

export const Transitions = React.memo(
  ({ transitions, currentState }: { transitions: TTransitions<any, any, any>; currentState: string }) => {
    return (
      <ul style={{ listStyleType: 'none', padding: '0.25rem 1rem' }}>
        {Object.keys(transitions).map(state => {
          return (
            <li key={state}>
              <div
                style={{
                  color: state === currentState ? colors.yellow : colors.text,
                }}
              >
                {state}
              </div>
              <ul
                style={{
                  listStyleType: 'none',
                  padding: '0.25rem 0.5rem',
                }}
              >
                {Object.keys(transitions[state]).map(action => {
                  return (
                    <li key={action} style={{ color: colors.purple }}>
                      {action}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  },
);
