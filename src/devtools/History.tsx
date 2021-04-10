import * as React from 'react';
import { HistoryItem } from './Manager';
import { colors } from './styles';
import ValueInspector from './ValueInspector';

const renderExec = (historyItem: HistoryItem & { type: 'state' }) => {
  switch (historyItem.exec.state) {
    case 'CANCELLED': {
      return <span style={{ marginLeft: '0.25rem', color: colors.red }}>{historyItem.exec.name}</span>;
    }
    case 'IDLE': {
      return null;
    }
    case 'PENDING': {
      return <span style={{ marginLeft: '0.25rem', color: colors.blue }}>{historyItem.exec.name}...</span>;
    }
    case 'RESOLVED': {
      return (
        <div style={{ display: 'flex' }}>
          <span style={{ marginLeft: '0.25rem', marginRight: '0.25rem', color: colors.blue }}>
            {historyItem.exec.name}
          </span>
          <ValueInspector value={historyItem.exec.result} small />
        </div>
      );
    }
  }
};

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
              {renderExec(item)}
            </li>
          );
        }

        return (
          <li key={index} style={{ display: 'flex', opacity: item.ignored ? 0.5 : 1 }}>
            <span style={{ marginRight: '0.25rem', color: colors.purple }}>{String(item.action.type)}</span>
            <ValueInspector value={item.action} small />
          </li>
        );
      })}
    </ul>
  );
});
