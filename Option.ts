// Copyright 2022 James Bradlee. All rights reserved. MIT License.

import { panic } from "./panic.ts";
import { Err, Ok, Result } from "./Result.ts";

type UnOptionize<X> = X extends Option<infer Y> ? Y : X;

export class Option<T> {
  protected static create_none() {
    return new Option<void>();
  }
  // deno-lint-ignore no-explicit-any
  protected static create_some(value?: any) {
    return new Option<void>({ value });
  }
  #has: boolean;
  #value?: T;
  protected constructor(value?: { value: T }) {
    if (typeof value === "object" && value !== null) {
      this.#has = true;
      this.#value = value.value;
    } else {
      this.#has = false;
    }
  }

  isSome() {
    return this.#has;
  }

  isSomeAnd(cb: (value: T) => boolean): boolean {
    if (this.#has) return cb(this.#value as T);
    return false;
  }

  isNone() {
    return !this.#has;
  }

  expect(message: string) {
    if (!this.#has) panic(message);
    return this.#value as T;
  }

  unwrap(): T {
    return this.expect("Option does not contain a value!");
  }

  unwrapOr(value: T): T {
    if (this.#has) return this.#value as T;
    return value;
  }

  unwrapOrElse(cb: () => T): T {
    if (this.#has) return this.#value as T;
    return cb();
  }

  map<R>(cb: (value: T) => R): Option<UnOptionize<R>> {
    if (this.#has) {
      const newValue = cb(this.#value as T);
      if (newValue instanceof Option) {
        return newValue;
      } else {
        // deno-lint-ignore no-explicit-any
        return Some(newValue as any);
      }
    }
    return None();
  }

  mapOr<R>(value: R, cb: (value: T) => R): R {
    if (this.#has) {
      return cb(this.#value as T);
    } else {
      return value;
    }
  }

  mapOrElse<R>(d: () => R, cb: (value: T) => R): R {
    if (this.#has) {
      return cb(this.#value as T);
    } else {
      return d();
    }
  }

  okOr<E>(err: E): Result<T, E> {
    if (this.#has) {
      return Ok(this.#value as T);
    } else {
      return Err(err);
    }
  }

  okOrElse<E>(cb: () => E): Result<T, E> {
    if (this.#has) {
      return Ok(this.#value as T);
    } else {
      return Err(cb());
    }
  }

  and<U>(other: Option<U>): Option<U> {
    if (this.#has && other.#has) {
      return other;
    } else {
      return None();
    }
  }

  andThen<U>(f: (value: T) => Option<U>) {
    if (this.#has) {
      return f(this.#value as T);
    } else {
      return None();
    }
  }

  filter(predicate: (value: T) => boolean): Option<T> {
    if (this.#has && predicate(this.#value as T)) {
      return this;
    } else {
      return None();
    }
  }

  or(other: Option<T>): Option<T> {
    if (!this.#has && other.#has) {
      return other;
    } else {
      return this;
    }
  }

  orElse(f: () => Option<T>): Option<T> {
    if (!this.#has) {
      const other = f();
      if (other.isNone()) return this;
      return other;
    } else {
      return this;
    }
  }

  xor(other: Option<T>): Option<T> {
    if (other.#has && this.#has) return None();
    if (!other.#has && this.#has) return this;
    if (other.#has && !this.#has) return other;
    return None();
  }

  insert(value: T): T {
    this.#value = value;
    this.#has = true;
    return value;
  }

  getOrInsert(value: T): T {
    if (this.#has) return this.#value as T;
    this.#value = value;
    this.#has = true;
    return value;
  }

  getOrInsertWith(f: () => T): T {
    if (this.#has) return this.#value as T;
    this.#value = f();
    return this.#value;
  }

  take(): Option<T> {
    if (this.#has) {
      const value = this.#value as T;
      this.#value = undefined;
      this.#has = false;
      return Some(value);
    } else {
      return this;
    }
  }

  replace(value: T): Option<T> {
    const oldValue = this.#value as T;
    const oldHadValue = this.#has;
    this.#value = value;
    this.#has = true;
    if (oldHadValue) {
      return Some(oldValue);
    } else {
      return None();
    }
  }

  // deno-lint-ignore no-explicit-any
  contains(value: any) {
    return this.#has && this.#value === value;
  }

  flatten(): Option<T> {
    if (this.#has) {
      if (this.#value! instanceof Option) {
        return this.#value;
      }
    }
    return this;
  }
}

// deno-lint-ignore no-explicit-any
export function None(): Option<any>;
export function None<T>(): Option<T>;
// deno-lint-ignore no-explicit-any
export function None(): Option<any> {
  // deno-lint-ignore no-explicit-any
  return (Option as any).create_none();
}

export function Some(): Option<void>;
export function Some<T>(value: T): Option<T>;
// deno-lint-ignore no-explicit-any
export function Some(value?: any): Option<any> {
  // deno-lint-ignore no-explicit-any
  return (Option as any).create_some(value);
}
