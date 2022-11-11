import { sprintf } from "./_/printf.ts";

// deno-lint-ignore no-explicit-any
export function panic(value: any, ...args: string[]) {
  if (typeof value === "string") {
    throw sprintf(value, ...args);
  }
  throw value;
}
