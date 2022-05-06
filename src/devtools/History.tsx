import * as React from 'react';
import { HistoryItem } from './Manager';
import { colors } from './styles';
import ValueInspector from './ValueInspector';

export const History = React.memo(({ history, filterIgnored }: { history: HistoryItem[]; filterIgnored: boolean }) => {
  return (
    <ul
      style={{
        listStyleType: 'none',
        padding: 0,
        color: colors.text,
        marginBottom: '0.5rem',
        fontSize: '14px',
      }}
    >
      {history.map((item, index) => {
        if (item.type === 'state') {
          return (
            <li
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.25rem',
              }}
            >
              <span
                style={{
                  marginRight: '0.25rem',
                  fontSize: '12px',
                  color: colors.orange,
                }}
              >
                state
              </span>
              <span
                style={{
                  marginRight: '0.25rem',
                }}
              >
                {item.state.state}
              </span>
              <ValueInspector value={item.state} small />
            </li>
          );
        }

        if (item.ignored && filterIgnored) {
          return null;
        }

        return (
          <li
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.25rem',
              opacity: item.ignored ? 0.5 : 1,
            }}
          >
            <span
              style={{
                marginRight: '0.25rem',
                fontSize: '12px',
                color: colors.green,
              }}
            >
              action
            </span>
            <span style={{ marginRight: '0.25rem' }}>{item.action.type}</span>
            <ValueInspector value={item.action} small />
          </li>
        );
      })}
    </ul>
  );
});
