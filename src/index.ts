import { sleep } from './utils';

export * from './utils';

export class HelloWorld {
  readonly foo: string;

  constructor(foo: string) {
    this.foo = foo;
  }

  getMessage() {
    return `Hello, this is ${this.foo}`;
  }
}

export async function doSomethingAsync() {
  await sleep(250);
  return 'hello';
}
