import * as React from 'react';
import { transition, useTransitionState, match, useEnterState } from '../';
import { colors } from './styles';

type State =
  | {
      state: 'IDLE';
    }
  | {
      state: 'DETECTING_RESIZE';
      initialX: number;
    }
  | {
      state: 'RESIZING';
      x: number;
    };

type Action =
  | {
      type: 'onMouseMove';
      x: number;
    }
  | {
      type: 'onMouseUp';
      x: number;
    }
  | {
      type: 'onMouseUpRezizer';
    }
  | {
      type: 'onMouseDown';
      x: number;
    };

const reducer = (prevState: State, action: Action) =>
  transition(prevState, action, {
    IDLE: {
      onMouseDown: (_, { x }) => ({
        state: 'DETECTING_RESIZE',
        initialX: x,
      }),
    },
    DETECTING_RESIZE: {
      onMouseMove: (state, { x }) => {
        if (Math.abs(x - state.initialX) > 3) {
          return {
            state: 'RESIZING',
            x,
          };
        }

        return state;
      },
      onMouseUp: () => ({
        state: 'IDLE',
      }),
      onMouseUpResizer: () => ({
        state: 'IDLE',
      }),
    },
    RESIZING: {
      onMouseMove: (_, { x }) => ({
        state: 'RESIZING',
        x,
      }),
      onMouseUp: () => ({
        state: 'IDLE',
      }),
    },
  });

export const Resizer = ({
  onResize,
  onClick,
  isOpen,
}: {
  onResize: (width: number) => void;
  onClick: () => void;
  isOpen: boolean;
}) => {
  const [resizer, dispatch] = React.useReducer(reducer, {
    state: 'IDLE',
  });

  useEnterState(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMoveListener = (event: MouseEvent) => dispatch({ type: 'onMouseMove', x: event.clientX });

    const onMouseUpListener = (event: MouseEvent) => dispatch({ type: 'onMouseUp', x: event.clientX });

    window.addEventListener('mousemove', onMouseMoveListener);
    window.addEventListener('mouseup', onMouseUpListener);

    return () => {
      window.removeEventListener('mousemove', onMouseMoveListener);
      window.removeEventListener('mouseup', onMouseUpListener);
    };
  });

  useTransitionState(
    resizer,
    ['DETECTING_RESIZE => onMouseMove => DETECTING_RESIZE', 'RESIZING => onMouseMove => RESIZING'],
    (_, { x }) => {
      onResize(window.innerWidth - x);
    },
  );

  useTransitionState(resizer, 'DETECTING_RESIZE => onMouseUpResizer => IDLE', () => onClick());

  const style: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: '10px',
    backgroundColor: colors.blue,
    userSelect: 'none',
    zIndex: 99999999,
  };

  return match(resizer, {
    IDLE: () => <div style={style} onMouseDown={(event) => dispatch({ type: 'onMouseDown', x: event.clientX })} />,
    DETECTING_RESIZE: () => <div style={style} onMouseUp={() => dispatch({ type: 'onMouseUpRezizer' })} />,
    RESIZING: () => <div style={style} />,
  });
};
