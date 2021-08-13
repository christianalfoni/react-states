import * as React from 'react';
import { StateTransition, useCommandEffect, useStateEffect, useStates } from '../';
import { colors } from './styles';

type State =
  | {
      context: 'IDLE';
    }
  | {
      context: 'DETECTING_RESIZE';
      initialX: number;
    }
  | {
      context: 'RESIZING';
      x: number;
    };

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

type Command =
  | {
      cmd: 'NOTIFY_RESIZE';
      x: number;
    }
  | {
      cmd: 'NOTIFY_CLICK';
    };

type Transition = StateTransition<State, Command>;

export const Resizer = ({
  onResize,
  onClick,
  isOpen,
}: {
  onResize: (width: number) => void;
  onClick: () => void;
  isOpen: boolean;
}) => {
  const [state, dispatch] = useStates<State, Action, Command>(
    { context: 'IDLE' },
    {
      IDLE: {
        MOUSE_DOWN: ({ x }): Transition => ({
          context: 'DETECTING_RESIZE',
          initialX: x,
        }),
      },
      DETECTING_RESIZE: {
        MOUSE_MOVE: ({ x }, state): Transition => {
          if (Math.abs(x - state.initialX) > 3) {
            return { context: 'RESIZING', x };
          }

          return state;
        },
        MOUSE_UP: (): Transition => ({ context: 'IDLE' }),
        MOUSE_UP_RESIZER: (_): Transition => [
          { context: 'IDLE' },
          {
            cmd: 'NOTIFY_CLICK',
          },
        ],
      },
      RESIZING: {
        MOUSE_MOVE: ({ x }, state): Transition => [
          { ...state, x },
          { cmd: 'NOTIFY_RESIZE', x },
        ],
        MOUSE_UP: (): Transition => ({ context: 'IDLE' }),
      },
    },
  );

  useStateEffect(state, ['DETECTING_RESIZE', 'RESIZING'], () => {
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

  useCommandEffect(state, 'NOTIFY_RESIZE', ({ x }) => {
    onResize(window.innerWidth - x);
  });

  useCommandEffect(state, 'NOTIFY_CLICK', () => {
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
      }}
      onMouseUp={() => {
        dispatch({
          type: 'MOUSE_UP_RESIZER',
        });
      }}
      onMouseDown={(event) => {
        dispatch({
          type: 'MOUSE_DOWN',
          x: event.clientX,
        });
      }}
    />
  );
};
