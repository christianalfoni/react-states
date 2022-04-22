import * as React from 'react';
import { transition, useCommandEffect, useStateEffect, $COMMAND, TTransitions, TTransition } from '../';
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
  cmd: '$NOTIFY_CLICK' as const,
});

const $NOTIFY_RESIZE = (x: number) => ({
  cmd: '$NOTIFY_RESIZE' as const,
  x,
});

const IDLE = (notifyClick = false) => ({
  state: 'IDLE' as const,
  [$COMMAND]: notifyClick ? $NOTIFY_CLICK() : undefined,
});

const DETECTING_RESIZE = (initialX: number) => ({
  state: 'DETECTING_RESIZE' as const,
  initialX,
  MOUSE_MOVE: (x: number) => RESIZING(x),
});

const RESIZING = (x: number) => ({
  state: 'RESIZING' as const,
  x,
  [$COMMAND]: $NOTIFY_RESIZE(x),
});

type State = ReturnType<typeof IDLE | typeof DETECTING_RESIZE | typeof RESIZING>;

const handlers: TTransitions<State, Action> = {
  IDLE: {
    MOUSE_DOWN: (_, { x }) => DETECTING_RESIZE(x),
  },
  DETECTING_RESIZE: {
    MOUSE_MOVE: (state, { x }) => {
      if (Math.abs(x - state.initialX) > 3) {
        return RESIZING(x);
      }

      return state;
    },
    MOUSE_UP: () => IDLE(),
    MOUSE_UP_RESIZER: () => IDLE(true),
  },
  RESIZING: {
    MOUSE_MOVE: (_, { x }) => RESIZING(x),
    MOUSE_UP: () => IDLE(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, handlers);

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
      dispatch({ type: 'MOUSE_MOVE', x: event.clientX });
    };
    const onMouseUp = (event: MouseEvent) => {
      dispatch({ type: 'MOUSE_UP', x: event.clientX });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  useCommandEffect(resizer, '$NOTIFY_RESIZE', ({ x }) => {
    onResize(window.innerWidth - x);
  });

  useCommandEffect(resizer, '$NOTIFY_CLICK', () => {
    onClick();
  });

  return (
    <div
      style={{
        position: 'absolute',
        height: '100%',
        width: '10px',
        backgroundColor: colors.blue,
        userSelect: 'none',
        zIndex: 99999999,
      }}
      onMouseUp={() => {
        dispatch({ type: 'MOUSE_UP_RESIZER' });
      }}
      onMouseDown={(event) => {
        dispatch({ type: 'MOUSE_DOWN', x: event.clientX });
      }}
    />
  );
};
