import { exec, transform, transition } from '.';

describe('react-states', () => {
  test('should transition states', () => {
    const state = {
      state: 'FOO',
    };
    expect(
      transition(
        state,
        {
          type: 'SWITCH',
        },
        {
          FOO: {
            SWITCH: () => ({ state: 'BAR' }),
          },
        },
      ),
    ).toEqual({ state: 'BAR' });
  });
  test('should ignore invalid transitions', () => {
    const state = {
      state: 'FOO',
    };
    expect(
      transition(
        state,
        {
          type: 'SWITCH',
        },
        {
          FOO: {},
        },
      ),
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
      transform(state, {
        FOO: () => 'foo',
      }),
    ).toBe('foo');
  });
  test('should transform to null when no match', () => {
    const state = {
      state: 'FOO',
    };
    expect(
      transform(state, {
        BAR: () => 'foo',
      }),
    ).toBe(null);
  });
});
