import { match, createReducer } from '.';

describe('react-states', () => {
  test('should transition states', () => {
    const context = {
      state: 'FOO',
    };
    const transition = createReducer({
      FOO: {
        SWITCH: () => ({ state: 'BAR' }),
      },
    });
    expect(
      transition(context, {
        type: 'SWITCH',
      }).state,
    ).toBe('BAR');
  });
  test('should ignore invalid transitions', () => {
    const state = {
      state: 'FOO',
    };
    const transition = createReducer({
      FOO: {},
    });
    expect(
      transition(state, {
        type: 'SWITCH',
      }),
    ).toBe(state);
  });
  test('should exec effects based on state', () => {
    const state = {
      state: 'FOO',
    };
    let hasRun = false;
    match(state, {
      FOO: () => {
        hasRun = true;
      },
    });
    expect(hasRun).toBe(true);
  });
  test('should return disposer', () => {
    const state = {
      state: 'FOO',
    };
    let isDisposed = false;
    const disposer = match(state, {
      FOO: () => () => {
        isDisposed = true;
      },
    });
    disposer();
    expect(isDisposed).toBe(true);
  });
  test('should transform', () => {
    const state = {
      state: 'FOO',
    };
    expect(
      match(state, {
        FOO: () => 'foo',
      }),
    ).toBe('foo');
  });
});
