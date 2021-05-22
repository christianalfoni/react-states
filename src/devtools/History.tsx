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
        padding: 0,
        color: colors.text,
        marginBottom: '0.5rem',
        fontSize: '14px',
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
                alignItems: 'center',
                marginBottom: '0.25rem',
              }}
            >
              <span
                style={{
                  marginRight: '0.25rem',
                  fontSize: '12px',
                  color: colors.yellow,
                }}
              >
                transient
              </span>
              <span
                style={{
                  marginRight: '0.25rem',
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
                  {item.context.state}
                </span>
                <ValueInspector value={item.context} small />
              </li>
              {transientItem}
            </React.Fragment>
          );
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
            <span style={{ marginRight: '0.25rem', fontSize: '12px', color: colors.green }}>event</span>
            <span style={{ marginRight: '0.25rem' }}>{item.event.type}</span>
            <ValueInspector value={item.event} small />
          </li>
        );
      })}
    </ul>
  );
});
