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
});
