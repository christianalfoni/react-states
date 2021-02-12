import { HelloWorld, doSomethingAsync } from '..';
import * as utils from '../utils';

test('hello world', () => {
  const thing = new HelloWorld('neat');
  expect(thing.getMessage()).toBe('Hello, this is neat');
});

test('utils', () => {
  expect(utils.add(1, 4)).toBe(5);
});

test('async', async () => {
  const result = await doSomethingAsync();
  expect(result).toBe('hello');
});
