// Copyright 2022 James Bradlee. All rights reserved. MIT License.

import { sprintf } from "./_/printf.ts";

/**
 * Throw any value.
 * @param value The value to throw.
 * @example Panic with an unknown value.
 *
 * ```ts
 * import { panic } from "./mod.ts";
 * panic(123);
 * ```
 *
 * @example Panic with an error.
 *
 * ```ts
 * import { panic } from "./mod.ts";
 * panic(new Error("hello world"));
 * ```
 */
export function panic(value: unknown): never;
/**
 * Throw a formatted error.
 * @param formatter A string that indicates how the error should be formatted.
 * @param args The arguments to pass to the formatter.
 * @example
 * Panic with a string message. This will format the string and turn it into an
 * Error object.
 *
 * ```ts
 * import { panic } from "./mod.ts";
 * panic("hello %s", "world");
 * ```
 */
export function panic(formatter: string, ...args: unknown[]): never;
export function panic(value: unknown, ...args: unknown[]): never {
  if (typeof value === "string") {
    throw new Error(sprintf(value, ...args));
  }
  throw value;
}
