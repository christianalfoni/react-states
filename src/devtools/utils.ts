export function isObject(obj: any) {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}

export function isArray(value: any) {
  return Array.isArray(value);
}

export function isBoolean(value: any) {
  return typeof value === 'boolean';
}

export function isString(value: any) {
  return typeof value === 'string';
}

export function isNumber(value: any) {
  return typeof value === 'number';
}

export function isNull(value: any) {
  return value === null;
}
