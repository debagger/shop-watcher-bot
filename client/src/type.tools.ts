/**
 * Extract array type
 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * Extract object property type
 */
export type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

/**
 * Extract async function type
 */
export type ReturnAsyncType<T> = T extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => PromiseLike<infer R> | undefined
  ? R
  : unknown;
