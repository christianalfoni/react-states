import * as React from 'react';
import { useCommandEffect, useStateEffect, createReducer, $COMMAND, PickCommandState, PickReturnTypes } from '../';
import { colors } from './styles';

const commands = {
  NOTIFY_CLICK: () => ({
    cmd: '$NOTIFY_CLICK' as const,
  }),
  NOTIFY_RESIZE: (x: number) => ({
    cmd: '$NOTIFY_RESIZE' as const,
    x,
  }),
};

const states = {
  IDLE: (notifyClick = false) => ({
    state: 'IDLE' as const,
    [$COMMAND]: notifyClick ? commands.NOTIFY_CLICK() : undefined,
  }),
  DETECTING_RESIZE: (initialX: number) => ({
    state: 'DETECTING_RESIZE' as const,
    initialX,
  }),
  RESIZING: (x: number) => ({
    state: 'RESIZING' as const,
    x,
    [$COMMAND]: commands.NOTIFY_RESIZE(x),
  }),
};

const actions = {
  MOUSE_MOVE: (x: number) => ({
    type: 'MOUSE_MOVE' as const,
    x,
  }),
  MOUSE_UP: (x: number) => ({
    type: 'MOUSE_UP' as const,
    x,
  }),
  MOUSE_UP_RESIZER: () => ({
    type: 'MOUSE_UP_RESIZER' as const,
  }),
  MOUSE_DOWN: (x: number) => ({
    type: 'MOUSE_DOWN' as const,
    x,
  }),
};

type State = PickReturnTypes<typeof states>;

type Action = PickReturnTypes<typeof actions>;

const reducer = createReducer<State, Action>({
  IDLE: {
    MOUSE_DOWN: (_, { x }) => states.DETECTING_RESIZE(x),
  },
  DETECTING_RESIZE: {
    MOUSE_MOVE: (state, { x }) => {
      if (Math.abs(x - state.initialX) > 3) {
        return states.RESIZING(x);
      }

      return state;
    },
    MOUSE_UP: () => states.IDLE(),
    MOUSE_UP_RESIZER: () => states.IDLE(true),
  },
  RESIZING: {
    MOUSE_MOVE: (_, { x }) => states.RESIZING(x),
    MOUSE_UP: () => states.IDLE(),
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
  const [resizer, dispatch] = React.useReducer(reducer, states.IDLE());

  useStateEffect(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMove = (event: MouseEvent) => {
      dispatch(actions.MOUSE_MOVE(event.clientX));
    };
    const onMouseUp = (event: MouseEvent) => {
      dispatch(actions.MOUSE_UP(event.clientX));
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
        dispatch(actions.MOUSE_UP_RESIZER());
      }}
      onMouseDown={(event) => {
        dispatch(actions.MOUSE_DOWN(event.clientX));
      }}
    />
  );
};
