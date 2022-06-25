import * as React from 'react';
import {
  createStates,
  StatesUnion,
  createActions,
  ActionsUnion,
  transition,
  useTransition,
  match,
  useEnter,
} from '../';
import { colors } from './styles';

const states = createStates({
  IDLE: () => ({}),
  DETECTING_RESIZE: (initialX: number) => ({ initialX }),
  RESIZING: (x: number) => ({ x }),
});

type State = StatesUnion<typeof states>;

const actions = createActions({
  onMouseMove: (x: number) => ({ x }),
  onMouseUp: (x: number) => ({ x }),
  onMouseUpResizer: () => ({}),
  onMouseDown: (x: number) => ({ x }),
});

type Action = ActionsUnion<typeof actions>;

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    IDLE: {
      onMouseDown: (_, { x }) => states.DETECTING_RESIZE(x),
    },
    DETECTING_RESIZE: {
      onMouseMove: (state, { x }) => {
        if (Math.abs(x - state.initialX) > 3) {
          return states.RESIZING(x);
        }

        return state;
      },
      onMouseUp: () => states.IDLE(),
      onMouseUpResizer: () => states.IDLE(),
    },
    RESIZING: {
      onMouseMove: (_, { x }) => states.RESIZING(x),
      onMouseUp: () => states.IDLE(),
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
  const { onMouseDown, onMouseMove, onMouseUp, onMouseUpResizer } = actions(dispatch);

  useEnter(resizer, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMoveListener = (event: MouseEvent) => onMouseMove(event.clientX);

    const onMouseUpListener = (event: MouseEvent) => onMouseUp(event.clientX);

    window.addEventListener('mousemove', onMouseMoveListener);
    window.addEventListener('mouseup', onMouseUpListener);

    return () => {
      window.removeEventListener('mousemove', onMouseMoveListener);
      window.removeEventListener('mouseup', onMouseUpListener);
    };
  });

  useTransition(
    resizer,
    ['DETECTING_RESIZE => onMouseMove => DETECTING_RESIZE', 'RESIZING => onMouseMove => RESIZING'],
    (_, { x }) => {
      onResize(window.innerWidth - x);
    },
  );

  useTransition(resizer, 'DETECTING_RESIZE => onMouseUpResizer => IDLE', () => onClick());

  const style: React.CSSProperties = {
    position: 'absolute',
    height: '100%',
    width: '10px',
    backgroundColor: colors.blue,
    userSelect: 'none',
    zIndex: 99999999,
  };

  return match(resizer, {
    IDLE: () => <div style={style} onMouseDown={(event) => onMouseDown(event.clientX)} />,
    DETECTING_RESIZE: () => <div style={style} onMouseUp={() => onMouseUpResizer()} />,
    RESIZING: () => <div style={style} />,
  });
};
