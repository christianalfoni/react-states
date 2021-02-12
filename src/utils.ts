export function add(a: number, b: number) {
  return a + b;
}

export function sleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}
