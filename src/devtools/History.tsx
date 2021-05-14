import * as React from 'react';
import { TRANSIENT_CONTEXT } from '..';
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
          // @ts-ignore
          const transientContext = item.context[TRANSIENT_CONTEXT];
          const transientItem = transientContext ? (
            <li
              key={index + transientContext.state}
              style={{
                display: 'flex',
              }}
            >
              <span
                style={{
                  marginRight: '0.25rem',
                  color: colors.blue,
                }}
              >
                {transientContext.state}
              </span>
              <ValueInspector value={transientContext} small />
            </li>
          ) : null;

          return (
            <React.Fragment key={index}>
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
              {transientItem}
            </React.Fragment>
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
