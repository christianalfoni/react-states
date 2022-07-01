import { act } from '@testing-library/react';
import React, { useReducer } from 'react';
import { $ACTION, $PREV_STATE, match, PickState, transition, useEnter, useTransition } from '.';
import { renderReducer } from './test';

type State = { state: 'FOO' } | { state: 'BAR' } | { state: 'OTHER' };
type Action = { type: 'SWITCH' } | { type: 'SWITCH_SAME' } | { type: 'NOOP' } | { type: 'SWITCH_OTHER' };

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    FOO: {
      SWITCH: (): PickState<State, 'BAR'> => ({ state: 'BAR' }),
      SWITCH_SAME: (): PickState<State, 'FOO'> => ({ state: 'FOO' }),
      NOOP: (state): PickState<State, 'FOO'> => state,
      SWITCH_OTHER: (): PickState<State, 'OTHER'> => ({ state: 'OTHER' }),
    },
    BAR: {
      SWITCH: (): PickState<State, 'FOO'> => ({ state: 'FOO' }),
      SWITCH_SAME: (): PickState<State, 'BAR'> => ({ state: 'BAR' }),
      NOOP: (state): PickState<State, 'BAR'> => state,
      SWITCH_OTHER: (): PickState<State, 'OTHER'> => ({ state: 'OTHER' }),
    },
    OTHER: {
      SWITCH: (): PickState<State, 'BAR'> => ({ state: 'BAR' }),
    },
  });

test('should transition states', () => {
  const state: State = {
    state: 'FOO',
  };

  const run = (state: State, action: Action) =>
    transition(state, action, {
      FOO: {
        SWITCH: (): State => ({ state: 'BAR' }),
      },
      BAR: {},
      OTHER: {},
    });
  expect(
    run(state, {
      type: 'SWITCH',
    }).state,
  ).toBe('BAR');
});
test('should ignore invalid transitions', () => {
  const state: State = {
    state: 'FOO',
  };
  const run = (state: State, action: Action) =>
    transition(state, action, {
      FOO: {},
      BAR: {},
      OTHER: {},
    });
  expect(
    run(state, {
      type: 'SWITCH',
    }),
  ).toBe(state);
});
test('should match', () => {
  const state = {
    state: 'FOO',
  };
  expect(
    match(state, {
      FOO: () => 'foo',
    }),
  ).toBe('foo');
});
test('should have fallback match', () => {
  type State =
    | {
        state: 'FOO';
      }
    | {
        state: 'BAR';
      };

  const state = {
    state: 'BAR',
  } as State;

  expect(
    match(
      state,
      {
        FOO: () => 'foo',
      },
      () => 'bar',
    ),
  ).toBe('bar');
});
describe('TRANSITIONS', () => {
  describe('useEnterEffect', () => {
    test('should run on initial state', () => {
      let hasRunEnteredEffect = false;
      const [] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'FOO' });

          useEnter(r[0], 'FOO', () => {
            hasRunEnteredEffect = true;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(hasRunEnteredEffect).toBe(true);
    });
    test('should run when prop updates', () => {
      let runEnteredEffectCount = 0;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'FOO' });

          useEnter(
            r[0],
            'FOO',
            () => {
              runEnteredEffectCount++;
            },
            [runEnteredEffectCount],
          );

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(runEnteredEffectCount).toBe(1);
      act(() => {
        dispatch({ type: 'SWITCH_SAME' });
      });
      expect(runEnteredEffectCount).toBe(2);
    });

    test('should run when entering new state', () => {
      let hasRunEnteredEffect = false;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'FOO' });

          useEnter(r[0], 'BAR', () => {
            hasRunEnteredEffect = true;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(hasRunEnteredEffect).toBe(false);
      act(() => {
        dispatch({ type: 'SWITCH' });
      });
      expect(hasRunEnteredEffect).toBe(true);
    });
    test('should not run when entering the same state', () => {
      let runEnteredEffectCount = 0;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'FOO' });

          useEnter(r[0], 'FOO', () => {
            runEnteredEffectCount++;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(runEnteredEffectCount).toBe(1);
      act(() => {
        dispatch({ type: 'SWITCH_SAME' });
      });
      expect(runEnteredEffectCount).toBe(1);
    });
    test('should run disposer when exiting state', () => {
      let hasRunDisposer = false;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'FOO' });

          useEnter(r[0], 'FOO', () => () => {
            hasRunDisposer = true;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(hasRunDisposer).toBe(false);
      act(() => {
        dispatch({ type: 'SWITCH' });
      });
      expect(hasRunDisposer).toBe(true);
    });
    test('should run entering either states', () => {
      let hasRunEnterEffect = false;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'BAR' });

          useEnter(r[0], ['FOO', 'BAR'], () => {
            hasRunEnterEffect = true;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(hasRunEnterEffect).toBe(true);
    });
    test('should not run enter associated state', () => {
      let runEnterEffectCount = 0;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'BAR' });

          useEnter(r[0], ['FOO', 'BAR'], () => {
            runEnterEffectCount++;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(runEnterEffectCount).toBe(1);
      act(() => {
        dispatch({
          type: 'SWITCH',
        });
      });
      expect(runEnterEffectCount).toBe(1);
    });
    test('should disposer entering other than associated state', () => {
      let runDisposeCount = 0;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'BAR' });

          useEnter(r[0], ['FOO', 'BAR'], () => () => {
            runDisposeCount++;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(runDisposeCount).toBe(0);
      act(() => {
        dispatch({
          type: 'SWITCH',
        });
      });
      expect(runDisposeCount).toBe(0);
      act(() => {
        dispatch({
          type: 'SWITCH_OTHER',
        });
      });
      expect(runDisposeCount).toBe(1);
    });
  });

  describe('useTransitionEffect', () => {
    test('should run when entering state by action from state', () => {
      let hasRunEffect = false;
      const [, dispatch] = renderReducer(
        () => {
          const r = useReducer(reducer, { state: 'OTHER' });

          useTransition(r[0], 'BAR => SWITCH => FOO', () => {
            hasRunEffect = true;
          });

          return r;
        },
        (ReducerHook) => <ReducerHook />,
      );
      expect(hasRunEffect).toBe(false);
      act(() => {
        // Switching from OTHER to BAR first
        dispatch({
          type: 'SWITCH',
        });
      });
      expect(hasRunEffect).toBe(false);
      act(() => {
        // Now to FOO from BAR
        dispatch({
          type: 'SWITCH',
        });
      });
      expect(hasRunEffect).toBe(true);
    });

    describe('ANY', () => {
      test('should give correct args', () => {
        let args: any[] = [];
        const [, dispatch] = renderReducer(
          () => {
            const r = useReducer(reducer, { state: 'FOO' });

            useTransition(r[0], (prev, action, current) => {
              args = [prev, action, current];
            });

            return r;
          },
          (ReducerHook) => <ReducerHook />,
        );
        expect(args).toEqual([
          {
            state: 'FOO',
          },
          undefined,
          undefined,
        ]);
        act(() => {
          dispatch({
            type: 'SWITCH',
          });
        });
        expect(args).toEqual([
          {
            state: 'BAR',
            [$ACTION]: {
              type: 'SWITCH',
            },
            [$PREV_STATE]: {
              state: 'FOO',
            },
          },
          {
            type: 'SWITCH',
          },
          {
            state: 'FOO',
          },
        ]);
        act(() => {
          dispatch({
            type: 'SWITCH',
          });
        });
        expect(args).toEqual([
          {
            state: 'FOO',
            [$ACTION]: {
              type: 'SWITCH',
            },
            [$PREV_STATE]: {
              state: 'BAR',
            },
          },
          {
            type: 'SWITCH',
          },
          {
            state: 'BAR',
          },
        ]);
      });
      test('should run on any transition', () => {
        let runEffectCount = 0;
        const [, dispatch] = renderReducer(
          () => {
            const r = useReducer(reducer, { state: 'FOO' });

            useTransition(r[0], () => {
              runEffectCount++;
            });

            return r;
          },
          (ReducerHook) => <ReducerHook />,
        );
        expect(runEffectCount).toBe(1);
        act(() => {
          dispatch({
            type: 'SWITCH',
          });
        });
        expect(runEffectCount).toBe(2);
        act(() => {
          dispatch({
            type: 'SWITCH_SAME',
          });
        });
        expect(runEffectCount).toBe(3);
      });
    });
  });
});
