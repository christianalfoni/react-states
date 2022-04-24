import * as React from 'react';
import {
  transition,
  useCommandEffect,
  useStateEffect,
  TTransitions,
  ReturnTypes,
  IAction,
  ICommand,
  PickCommand,
  IState,
  match,
  pick,
  $COMMAND,
} from '../';
import { colors } from './styles';

const actions = {
  MOUSE_MOVE: ({ x }: { x: number }) => ({
    type: 'MOUSE_MOVE' as const,
    x,
  }),
  MOUSE_UP: ({ x }: { x: number }) => ({
    type: 'MOUSE_UP' as const,
    x,
  }),
  MOUSE_UP_RESIZER: () => ({
    type: 'MOUSE_UP_RESIZER' as const,
  }),
  MOUSE_DOWN: ({ x }: { x: number }) => ({
    type: 'MOUSE_DOWN' as const,
    x,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  NOTIFY_CLICK: () => ({
    cmd: 'NOTIFY_CLICK' as const,
  }),
  NOTIFY_RESIZE: ({ x }: { x: number }) => ({
    cmd: 'NOTIFY_RESIZE' as const,
    x,
  }),
};

type Command = ReturnTypes<typeof commands, ICommand>;

const states = {
  IDLE: (command?: PickCommand<Command, 'NOTIFY_CLICK'>) => ({
    state: 'IDLE' as const,
    [$COMMAND]: command,
    ...pick(actions, 'MOUSE_DOWN'),
  }),
  DETECTING_RESIZE: ({ initialX }: { initialX: number }) => ({
    state: 'DETECTING_RESIZE' as const,
    initialX,
    ...pick(actions, 'MOUSE_MOVE', 'MOUSE_UP', 'MOUSE_UP_RESIZER'),
  }),
  RESIZING: ({ x }: { x: number }) => ({
    state: 'RESIZING' as const,
    x,
    ...pick(actions, 'MOUSE_MOVE', 'MOUSE_UP'),
    [$COMMAND]: commands.NOTIFY_RESIZE({ x }),
  }),
};

type State = ReturnTypes<typeof states, IState>;

const { IDLE, DETECTING_RESIZE, RESIZING } = states;

const transitions: TTransitions<State, Action> = {
  IDLE: {
    MOUSE_DOWN: (_, { x }) => DETECTING_RESIZE({ initialX: x }),
  },
  DETECTING_RESIZE: {
    MOUSE_MOVE: (state, { x }) => {
      if (Math.abs(x - state.initialX) > 3) {
        return RESIZING({ x });
      }

      return state;
    },
    MOUSE_UP: () => IDLE(),
    MOUSE_UP_RESIZER: () => IDLE(commands.NOTIFY_CLICK()),
  },
  RESIZING: {
    MOUSE_MOVE: (_, { x }) => RESIZING({ x }),
    MOUSE_UP: () => IDLE(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);

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

  useStateEffect(resizer, ['DETECTING_RESIZE', 'RESIZING'], ({ MOUSE_MOVE, MOUSE_UP }) => {
    const onMouseMove = (event: MouseEvent) => {
      dispatch(MOUSE_MOVE({ x: event.clientX }));
    };
    const onMouseUp = (event: MouseEvent) => {
      dispatch(MOUSE_UP({ x: event.clientX }));
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
    IDLE: ({ MOUSE_DOWN }) => (
      <div
        style={style}
        onMouseDown={(event) => {
          dispatch(MOUSE_DOWN({ x: event.clientX }));
        }}
      />
    ),
    DETECTING_RESIZE: ({ MOUSE_UP_RESIZER }) => (
      <div
        style={style}
        onMouseUp={() => {
          dispatch(MOUSE_UP_RESIZER());
        }}
      />
    ),
    RESIZING: () => <div style={style} />,
  });
};
