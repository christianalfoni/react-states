import * as React from 'react';
import { transition, useStateTransition, match } from '../';
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
      type: 'ON_MOUSE_MOVE';
      x: number;
    }
  | {
      type: 'ON_MOUSE_UP';
      x: number;
    }
  | {
      type: 'ON_MOUSE_UP_RESIZER';
    }
  | {
      type: 'ON_MOUSE_DOWN';
      x: number;
    };

const reducer = (prevState: State, action: Action) =>
  transition(prevState, action, {
    IDLE: {
      ON_MOUSE_DOWN: (_, { x }) => ({
        state: 'DETECTING_RESIZE',
        initialX: x,
      }),
    },
    DETECTING_RESIZE: {
      ON_MOUSE_MOVE: (state, { x }) => {
        if (Math.abs(x - state.initialX) > 3) {
          return {
            state: 'RESIZING',
            x,
          };
        }

        return state;
      },
      ON_MOUSE_UP: () => ({
        state: 'IDLE',
      }),
      ON_MOUSE_UP_RESIZER: () => ({
        state: 'IDLE',
      }),
    },
    RESIZING: {
      ON_MOUSE_MOVE: (_, { x }) => ({
        state: 'RESIZING',
        x,
      }),
      ON_MOUSE_UP: () => ({
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

  useStateTransition(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMoveListener = (event: MouseEvent) => dispatch({ type: 'ON_MOUSE_MOVE', x: event.clientX });
    const onMouseUpListener = (event: MouseEvent) => dispatch({ type: 'ON_MOUSE_UP', x: event.clientX });

    window.addEventListener('mousemove', onMouseMoveListener);
    window.addEventListener('mouseup', onMouseUpListener);

    return () => {
      window.removeEventListener('mousemove', onMouseMoveListener);
      window.removeEventListener('mouseup', onMouseUpListener);
    };
  });

  useStateTransition(
    resizer,
    {
      DETECTING_RESIZE: 'ON_MOUSE_MOVE',
      RESIZING: 'ON_MOUSE_MOVE',
    },
    ({ x }) => {
      onResize(window.innerWidth - x);
    },
  );

  useStateTransition(
    resizer,
    {
      DETECTING_RESIZE: 'ON_MOUSE_UP_RESIZER',
    },
    () => onClick(),
  );

  const style: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: '10px',
    backgroundColor: colors.blue,
    userSelect: 'none',
    zIndex: 99999999,
  };

  return match(resizer, {
    IDLE: () => <div style={style} onMouseDown={(event) => dispatch({ type: 'ON_MOUSE_DOWN', x: event.clientX })} />,
    DETECTING_RESIZE: () => <div style={style} onMouseUp={() => dispatch({ type: 'ON_MOUSE_UP_RESIZER' })} />,
    RESIZING: () => <div style={style} />,
  });
};
