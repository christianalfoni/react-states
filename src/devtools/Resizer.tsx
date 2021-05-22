import * as React from 'react';
import { createReducer, match, useEnterEffect, useMatchEffect } from '../';
import { colors } from './styles';

type Context =
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

type TransientContext =
  | {
      state: 'NOTIFYING_RESIZE';
      x: number;
    }
  | {
      state: 'NOTIFYING_CLICK';
    };

type Event =
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

const reducer = createReducer<Context, Event, TransientContext>(
  {
    IDLE: {
      MOUSE_DOWN: ({ x }) => ({
        state: 'DETECTING_RESIZE',
        initialX: x,
      }),
    },
    DETECTING_RESIZE: {
      MOUSE_MOVE: ({ x }, context) => {
        if (Math.abs(x - context.initialX) > 3) {
          return { state: 'RESIZING', x };
        }

        return context;
      },
      MOUSE_UP: () => ({ state: 'IDLE' }),
      MOUSE_UP_RESIZER: () => ({
        state: 'NOTIFYING_CLICK',
      }),
    },
    RESIZING: {
      MOUSE_MOVE: ({ x }) => ({ state: 'NOTIFYING_RESIZE', x }),
      MOUSE_UP: () => ({ state: 'IDLE' }),
    },
  },
  {
    NOTIFYING_RESIZE: ({ x }) => ({
      state: 'RESIZING',
      x,
    }),
    NOTIFYING_CLICK: () => ({
      state: 'IDLE',
    }),
  },
);

export const Resizer = ({
  onResize,
  onClick,
  isOpen,
}: {
  onResize: (width: number) => void;
  onClick: () => void;
  isOpen: boolean;
}) => {
  const [resize, send] = React.useReducer(reducer, {
    state: 'IDLE',
  });

  useMatchEffect(resize, ['DETECTING_RESIZE', 'RESIZING'], () => {
    const onMouseMove = (event: MouseEvent) => {
      send({
        type: 'MOUSE_MOVE',
        x: event.clientX,
      });
    };
    const onMouseUp = (event: MouseEvent) => {
      send({
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

  useEnterEffect(resize, 'NOTIFYING_RESIZE', ({ x }) => {
    onResize(window.innerWidth - x);
  });

  useEnterEffect(resize, 'NOTIFYING_CLICK', () => {
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
        send({
          type: 'MOUSE_UP_RESIZER',
        });
      }}
      onMouseDown={(event) => {
        send({
          type: 'MOUSE_DOWN',
          x: event.clientX,
        });
      }}
    />
  );
};
