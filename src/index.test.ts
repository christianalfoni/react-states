import { match, transition } from '.';

type Context = { state: 'FOO' } | { state: 'BAR' };
type Event = { type: 'SWITCH' };

describe('react-states', () => {
  test('should transition states', () => {
    const context: Context = {
      state: 'FOO',
    };

    const run = (context: Context, event: Event) =>
      transition(context, event, {
        FOO: {
          SWITCH: (): Context => ({ state: 'BAR' }),
        },
        BAR: {},
      });
    expect(
      run(context, {
        type: 'SWITCH',
      }).state,
    ).toBe('BAR');
  });
  test('should ignore invalid transitions', () => {
    const context: Context = {
      state: 'FOO',
    };
    const run = (context: Context, event: Event) =>
      transition(context, event, {
        FOO: {},
        BAR: {},
      });
    expect(
      run(context, {
        type: 'SWITCH',
      }),
    ).toBe(context);
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
