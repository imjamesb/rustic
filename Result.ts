import { panic } from "./panic.ts";

export class Result<T, E> {
  // deno-lint-ignore no-explicit-any
  protected static from_ok(value: any) {
    return new Result(false, value);
  }

  // deno-lint-ignore no-explicit-any
  protected static from_err(error: any) {
    return new Result(true, undefined, error);
  }

  #value?: T;
  #error?: E;
  #isError: boolean;

  protected constructor(isError: boolean, value?: T, error?: E) {
    this.#value = value;
    this.#error = error;
    this.#isError = isError;
  }

  isOk() {
    return !this.#isError;
  }

  isErr() {
    return this.#isError;
  }

  expect(message: string) {
    if (this.#isError) panic(message);
    return this.#value as T;
  }

  expectErr(message: string) {
    if (!this.#isError) panic(message);
    return this.#error as E;
  }

  unwrap() {
    return this.expect(this.#error as unknown as string);
  }

  unwrapErr() {
    return this.expectErr(this.#value as unknown as string);
  }

  and(res: Result<T, E>): Result<T, E> {
    if (this.#isError) return this;
    return res;
  }

  andThen(cb: (value: T) => Result<T, E>) {
    if (!this.isErr) return cb(this.#value as T);
    return this;
  }

  or(res: Result<T, E>): Result<T, E> {
    if (this.#isError && res.#isError || this.#isError && !res.#isError) {
      return res;
    } else {
      return this;
    }
  }

  orElse(cb: (error: E) => Result<T, E>): Result<T, E> {
    if (this.#isError) return cb(this.#error as E);
    return this;
  }

  unwrapOr(value: T): T {
    return this.#isError ? value : this.#value as T;
  }

  unwrapOrElse(cb: (error: E) => T): T {
    return this.#isError ? cb(this.#error as E) : this.#value as T;
  }
}

// deno-lint-ignore no-explicit-any
export function Ok(): Result<void, any>;
// deno-lint-ignore no-explicit-any
export function Ok<T>(value: T): Result<T, any>;
// deno-lint-ignore no-explicit-any
export function Ok(value?: any): Result<any, any> {
  // deno-lint-ignore no-explicit-any
  return (Result as any).from_ok(value);
}

// deno-lint-ignore no-explicit-any
export function Err(): Result<any, void>;
// deno-lint-ignore no-explicit-any
export function Err<E>(error: E): Result<any, E>;
// deno-lint-ignore no-explicit-any
export function Err(error?: any): Result<any, any> {
  // deno-lint-ignore no-explicit-any
  return (Result as any).from_err(error);
}
