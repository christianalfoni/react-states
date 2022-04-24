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
  MOUSE_MOVE: (params: { x: number }) => ({
    ...params,
    type: 'MOUSE_MOVE' as const,
  }),
  MOUSE_UP: (params: { x: number }) => ({
    ...params,
    type: 'MOUSE_UP' as const,
  }),
  MOUSE_UP_RESIZER: () => ({
    type: 'MOUSE_UP_RESIZER' as const,
  }),
  MOUSE_DOWN: (params: { x: number }) => ({
    ...params,
    type: 'MOUSE_DOWN' as const,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  NOTIFY_CLICK: () => ({
    cmd: 'NOTIFY_CLICK' as const,
  }),
  NOTIFY_RESIZE: (params: { x: number }) => ({
    ...params,
    cmd: 'NOTIFY_RESIZE' as const,
  }),
};

type Command = ReturnTypes<typeof commands, ICommand>;

const states = {
  IDLE: (command?: PickCommand<Command, 'NOTIFY_CLICK'>) => ({
    ...pick(actions, 'MOUSE_DOWN'),
    [$COMMAND]: command,
    state: 'IDLE' as const,
  }),
  DETECTING_RESIZE: (params: { initialX: number }) => ({
    ...params,
    ...pick(actions, 'MOUSE_MOVE', 'MOUSE_UP', 'MOUSE_UP_RESIZER'),
    state: 'DETECTING_RESIZE' as const,
  }),
  RESIZING: (params: { x: number }) => ({
    ...params,
    ...pick(actions, 'MOUSE_MOVE', 'MOUSE_UP'),
    [$COMMAND]: commands.NOTIFY_RESIZE({ x: params.x }),
    state: 'RESIZING' as const,
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
