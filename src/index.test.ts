import { exec, match, transitions } from '.';

describe('react-states', () => {
  test('should transition states', () => {
    const context = {
      state: 'FOO',
    };
    const transition = transitions({
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
    const transition = transitions({
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
    exec(state, {
      FOO: () => {
        hasRun = true;
      },
    });
    expect(hasRun).toBe(true);
  });
  test('should ignore effects where no matching state', () => {
    const state = {
      state: 'FOO',
    };
    let hasRun = false;
    exec(state, {
      BAR: () => {
        hasRun = true;
      },
    });
    expect(hasRun).toBe(false);
  });
  test('should return disposer', () => {
    const state = {
      state: 'FOO',
    };
    let isDisposed = false;
    const disposer = exec(state, {
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
  test('should transform to null when no match', () => {
    const state = {
      state: 'FOO',
    };
    expect(
      match(state, {
        BAR: () => 'foo',
      }),
    ).toBe(null);
  });
});
