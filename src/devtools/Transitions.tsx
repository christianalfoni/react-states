import * as React from 'react';
import { colors } from './styles';

export const Transitions = React.memo(
  ({
    transitions,
    currentState,
  }: {
    transitions: {
      [key: string]: {
        [key: string]: Function;
      };
    };
    currentState: string | symbol;
  }) => {
    return (
      <ul style={{ listStyleType: 'none', padding: '0', fontSize: '14px' }}>
        {Object.keys(transitions).map((state) => {
          return (
            <li key={state}>
              <div
                style={{
                  color: state === currentState ? colors.orange : colors.text,
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
                {Object.keys(transitions[state]).map((event) => {
                  return (
                    <li key={event} style={{ color: colors.green, fontSize: '14px' }}>
                      {event}
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
