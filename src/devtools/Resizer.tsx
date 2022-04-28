import * as React from 'react';
import { transition, useCommandEffect, useStateEffect, PickCommand, match, $COMMAND } from '../';
import { colors } from './styles';

type Action =
  | {
      type: 'MOUSE_MOVE';
      x: number;
    }
  | {
      type: 'MOUSE_UP';
      x: number;
    }
  | {
      type: 'MOUSE_UP_RESIZER';
    }
  | {
      type: 'MOUSE_DOWN';
      x: number;
    };

const $NOTIFY_CLICK = () => ({
  cmd: 'NOTIFY_CLICK' as const,
});

const $NOTIFY_RESIZE = (x: number) => ({
  cmd: 'NOTIFY_RESIZE' as const,
  x,
});

type Command = ReturnType<typeof $NOTIFY_CLICK | typeof $NOTIFY_RESIZE>;

const IDLE = (command?: PickCommand<Command, 'NOTIFY_CLICK'>) => ({
  state: 'IDLE' as const,
  [$COMMAND]: command,
});

const DETECTING_RESIZE = (initialX: number) => ({
  state: 'DETECTING_RESIZE' as const,
  initialX,
});

const RESIZING = (x: number) => ({
  state: 'RESIZING' as const,
  x,
  [$COMMAND]: $NOTIFY_RESIZE(x),
});

type State = ReturnType<typeof IDLE | typeof DETECTING_RESIZE | typeof RESIZING>;

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    IDLE: {
      MOUSE_DOWN: (_, { x }) => DETECTING_RESIZE(x),
    },
    DETECTING_RESIZE: {
      MOUSE_MOVE: (mouseDownState, { x }) => {
        if (Math.abs(x - mouseDownState.initialX) > 3) {
          return RESIZING(x);
        }

        return mouseDownState;
      },
      MOUSE_UP: () => IDLE(),
      MOUSE_UP_RESIZER: () => IDLE($NOTIFY_CLICK()),
    },
    RESIZING: {
      MOUSE_MOVE: (_, { x }) => RESIZING(x),
      MOUSE_UP: () => IDLE(),
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
  const [resizer, dispatch] = React.useReducer(reducer, IDLE());

  useStateEffect(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMove = (event: MouseEvent) => {
      dispatch({
        type: 'MOUSE_MOVE',
        x: event.clientX,
      });
    };
    const onMouseUp = (event: MouseEvent) => {
      dispatch({
        type: 'MOUSE_UP',
        x: event.clientX,
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  useCommandEffect(resizer, 'NOTIFY_RESIZE', ({ x }) => {
    onResize(window.innerWidth - x);
  });

  useCommandEffect(resizer, 'NOTIFY_CLICK', () => {
    onClick();
  });

  const style: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: '10px',
    backgroundColor: colors.blue,
    userSelect: 'none',
    zIndex: 99999999,
  };

  return match(resizer, {
    IDLE: () => (
      <div
        style={style}
        onMouseDown={(event) => {
          dispatch({
            type: 'MOUSE_DOWN',
            x: event.clientX,
          });
        }}
      />
    ),
    DETECTING_RESIZE: () => (
      <div
        style={style}
        onMouseUp={() => {
          dispatch({
            type: 'MOUSE_UP_RESIZER',
          });
        }}
      />
    ),
    RESIZING: () => <div style={style} />,
  });
};
