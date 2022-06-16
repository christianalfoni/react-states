import * as React from 'react';
import { transition, useTransitionEffect, match, PickState, useEnterEffect } from '../';
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

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    IDLE: {
      MOUSE_DOWN: (_, { x }): PickState<State, 'DETECTING_RESIZE'> => ({
        state: 'DETECTING_RESIZE',
        initialX: x,
      }),
    },
    DETECTING_RESIZE: {
      MOUSE_MOVE: (current, { x }): PickState<State, 'RESIZING' | 'DETECTING_RESIZE'> => {
        if (Math.abs(x - current.initialX) > 3) {
          return {
            state: 'RESIZING',
            x,
          };
        }

        return current;
      },
      MOUSE_UP: (): PickState<State, 'IDLE'> => ({
        state: 'IDLE',
      }),
      MOUSE_UP_RESIZER: (): PickState<State, 'IDLE'> => ({
        state: 'IDLE',
      }),
    },
    RESIZING: {
      MOUSE_MOVE: (_, { x }): PickState<State, 'RESIZING'> => ({
        state: 'RESIZING',
        x,
      }),
      MOUSE_UP: (): PickState<State, 'IDLE'> => ({
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

  useEnterEffect(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
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

  useTransitionEffect(
    resizer,
    ['DETECTING_RESIZE => MOUSE_MOVE => DETECTING_RESIZE', 'RESIZING => MOUSE_MOVE => RESIZING'],
    (_, { x }) => {
      onResize(window.innerWidth - x);
    },
  );

  useTransitionEffect(resizer, 'DETECTING_RESIZE => MOUSE_UP_RESIZER => IDLE', () => onClick());

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
