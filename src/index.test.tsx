import { act, renderHook } from '@testing-library/react-hooks';
import React, { useReducer } from 'react';
import { match, transition, useEnterState, useTransitionState } from '.';
import { $ACTION, $PREV_STATE } from './constants';

type State = { state: 'FOO' } | { state: 'BAR' } | { state: 'OTHER' };
type Action = { type: 'SWITCH' } | { type: 'SWITCH_SAME' } | { type: 'NOOP' } | { type: 'SWITCH_OTHER' };

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    FOO: {
      SWITCH: () => ({ state: 'BAR' }),
      SWITCH_SAME: () => ({ state: 'FOO' }),
      NOOP: (state) => state,
      SWITCH_OTHER: () => ({ state: 'OTHER' }),
    },
    BAR: {
      SWITCH: () => ({ state: 'FOO' }),
      SWITCH_SAME: () => ({ state: 'BAR' }),
      NOOP: (state) => state,
      SWITCH_OTHER: () => ({ state: 'OTHER' }),
    },
    OTHER: {
      SWITCH: () => ({ state: 'BAR' }),
    },
  });

test('should transition states', () => {
  const state: State = {
    state: 'FOO',
  };

  const run = (prevState: State, action: Action) =>
    transition(prevState, action, {
      FOO: {
        SWITCH: () => ({ state: 'BAR' }),
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
  const run = (prevState: State, action: Action) =>
    transition(prevState, action, {
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
      renderHook(() => {
        const r = useReducer(reducer, { state: 'FOO' });

        useEnterState(r[0], 'FOO', () => {
          hasRunEnteredEffect = true;
        });

        return r;
      });
      expect(hasRunEnteredEffect).toBe(true);
    });
    test('should run when prop updates', () => {
      let runEnteredEffectCount = 0;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'FOO' });

        useEnterState(
          r[0],
          'FOO',
          () => {
            runEnteredEffectCount++;
          },
          [runEnteredEffectCount],
        );

        return r;
      });
      expect(runEnteredEffectCount).toBe(1);
      act(() => {
        result.current[1]({ type: 'SWITCH_SAME' });
      });
      expect(runEnteredEffectCount).toBe(2);
    });

    test('should run when entering new state', () => {
      let hasRunEnteredEffect = false;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'FOO' });

        useEnterState(r[0], 'BAR', () => {
          hasRunEnteredEffect = true;
        });

        return r;
      });
      expect(hasRunEnteredEffect).toBe(false);
      act(() => {
        result.current[1]({ type: 'SWITCH' });
      });
      expect(hasRunEnteredEffect).toBe(true);
    });
    test('should not run when entering the same state', () => {
      let runEnteredEffectCount = 0;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'FOO' });

        useEnterState(r[0], 'FOO', () => {
          runEnteredEffectCount++;
        });

        return r;
      });
      expect(runEnteredEffectCount).toBe(1);
      act(() => {
        result.current[1]({ type: 'SWITCH_SAME' });
      });
      expect(runEnteredEffectCount).toBe(1);
    });
    test('should run disposer when exiting state', () => {
      let hasRunDisposer = false;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'FOO' });

        useEnterState(r[0], 'FOO', () => () => {
          hasRunDisposer = true;
        });

        return r;
      });
      expect(hasRunDisposer).toBe(false);
      act(() => {
        result.current[1]({ type: 'SWITCH' });
      });
      expect(hasRunDisposer).toBe(true);
    });
    test('should run entering either states', () => {
      let hasRunEnterEffect = false;
      renderHook(() => {
        const r = useReducer(reducer, { state: 'BAR' });

        useEnterState(r[0], ['FOO', 'BAR'], () => {
          hasRunEnterEffect = true;
        });

        return r;
      });
      expect(hasRunEnterEffect).toBe(true);
    });
    test('should not run enter associated state', () => {
      let runEnterEffectCount = 0;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'BAR' });

        useEnterState(r[0], ['FOO', 'BAR'], () => {
          runEnterEffectCount++;
        });

        return r;
      });
      expect(runEnterEffectCount).toBe(1);
      act(() => {
        result.current[1]({
          type: 'SWITCH',
        });
      });
      expect(runEnterEffectCount).toBe(1);
    });
    test('should disposer entering other than associated state', () => {
      let runDisposeCount = 0;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'BAR' });

        useEnterState(r[0], ['FOO', 'BAR'], () => () => {
          runDisposeCount++;
        });

        return r;
      });
      expect(runDisposeCount).toBe(0);
      act(() => {
        result.current[1]({
          type: 'SWITCH',
        });
      });
      expect(runDisposeCount).toBe(0);
      act(() => {
        result.current[1]({
          type: 'SWITCH_OTHER',
        });
      });
      expect(runDisposeCount).toBe(1);
    });
  });

  describe('useTransitionEffect', () => {
    test('should run when entering state by action from state', () => {
      let hasRunEffect = false;
      const { result } = renderHook(() => {
        const r = useReducer(reducer, { state: 'OTHER' });

        useTransitionState(r[0], 'BAR => SWITCH => FOO', () => {
          hasRunEffect = true;
        });

        return r;
      });
      expect(hasRunEffect).toBe(false);
      act(() => {
        // Switching from OTHER to BAR first
        result.current[1]({
          type: 'SWITCH',
        });
      });
      expect(hasRunEffect).toBe(false);
      act(() => {
        // Now to FOO from BAR
        result.current[1]({
          type: 'SWITCH',
        });
      });
      expect(hasRunEffect).toBe(true);
    });

    describe('ANY', () => {
      test('should give correct args', () => {
        let args: any[] = [];
        const { result } = renderHook(() => {
          const r = useReducer(reducer, { state: 'FOO' });

          useTransitionState(r[0], (prev, action, current) => {
            args = [prev, action, current];
          });

          return r;
        });
        expect(args).toEqual([
          {
            state: 'FOO',
          },
          undefined,
          undefined,
        ]);
        act(() => {
          result.current[1]({
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
          result.current[1]({
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
        const { result } = renderHook(() => {
          const r = useReducer(reducer, { state: 'FOO' });

          useTransitionState(r[0], () => {
            runEffectCount++;
          });

          return r;
        });
        expect(runEffectCount).toBe(1);
        act(() => {
          result.current[1]({
            type: 'SWITCH',
          });
        });
        expect(runEffectCount).toBe(2);
        act(() => {
          result.current[1]({
            type: 'SWITCH_SAME',
          });
        });
        expect(runEffectCount).toBe(3);
      });
    });
  });
});
