import * as React from 'react';
import { HistoryItem } from './Manager';
import { colors } from './styles';
import ValueInspector from './ValueInspector';

export const History = React.memo(({ history }: { history: HistoryItem[] }) => {
  return (
    <ul
      style={{
        listStyleType: 'none',
        padding: '0.25rem 1rem',
        color: colors.text,
      }}
    >
      {history.map((item, index) => {
        if (item.type === 'state') {
          return (
            <li
              key={index}
              style={{
                display: 'flex',
              }}
            >
              <span
                style={{
                  marginRight: '0.25rem',
                  color: colors.yellow,
                }}
              >
                {item.context.state}
              </span>
              <ValueInspector value={item.context} small />
            </li>
          );
        }

        return (
          <li key={index} style={{ display: 'flex', opacity: item.ignored ? 0.5 : 1 }}>
            <span style={{ marginRight: '0.25rem', color: colors.purple }}>{String(item.event.type)}</span>
            <ValueInspector value={item.event} small />
          </li>
        );
      })}
    </ul>
  );
});
