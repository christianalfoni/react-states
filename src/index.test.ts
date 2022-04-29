import { match, transition } from '.';

type State = { state: 'FOO' } | { state: 'BAR' };
type Action = { type: 'SWITCH' };

describe('react-states', () => {
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
      });
    expect(
      run(state, {
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
